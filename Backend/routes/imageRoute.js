import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import crypto from "crypto";

const router = express.Router();

const CACHE_DIR = path.join(process.cwd(), "public", "image_cache");
fs.mkdirSync(CACHE_DIR, { recursive: true });

// In-flight fetch map to deduplicate concurrent requests for the same image
const inFlight = new Map();

router.get("/fetch", async (req, res) => {
    const { u: url, w, h } = req.query;
    if (!url) return res.status(400).send("Missing url parameter 'u'");

    const hash = crypto.createHash("sha1").update(url + `|w=${w || ""}|h=${h || ""}`).digest("hex");
    const filename = `${hash}.jpg`;
    const filePath = path.join(CACHE_DIR, filename);

    // ✅ Serve from disk cache if already downloaded
    if (fs.existsSync(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return res.sendFile(filePath);
    }

    // ✅ Deduplicate: if there's already a fetch in progress for this URL, wait for it
    if (inFlight.has(hash)) {
        try {
            await inFlight.get(hash);
            if (fs.existsSync(filePath)) {
                res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
                return res.sendFile(filePath);
            }
        } catch (_) {}
        return res.sendFile(path.join(process.cwd(), "public", "fallback_image.png"));
    }

    // ✅ Fetch the image, await it, then serve it
    const fetchPromise = (async () => {
        const headers = {
            "User-Agent": "DumbChefs/1.0",
            Accept: "image/*,*/*;q=0.8",
        };
        const resp = await axios.get(url, {
            responseType: "stream",
            timeout: 15000,
            headers,
            maxRedirects: 5,
        });

        await new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(filePath);
            resp.data.pipe(writer);
            writer.on("finish", resolve);
            writer.on("error", (err) => {
                try { fs.unlinkSync(filePath); } catch (_) {}
                reject(err);
            });
        });
    })();

    inFlight.set(hash, fetchPromise);

    try {
        await fetchPromise;
        inFlight.delete(hash);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return res.sendFile(filePath);
    } catch (err) {
        inFlight.delete(hash);
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
        console.error("Image fetch failed:", err?.message || err);
        return res.sendFile(path.join(process.cwd(), "public", "fallback_image.png"));
    }
});

export default router;
