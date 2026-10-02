# Final packaged demo media

This folder contains the photorealistic AI-generated demo images currently available from the image-generation batches in this chat.

Packaged beneficiaries:
- OPS-DM-001: 2 images
- OPS-DM-003: 7 images
- OPS-DM-014: 10 images

Total: 19 unique JPG files.

The remaining demo beneficiaries intentionally have no linked media in this delivery, so the UI should show its normal empty state rather than a broken URL.

Important: these are realistic AI-generated demo images, not photographs of real beneficiaries. Any identity/consent/LR-style document is fictional and marked DEMO/SAMPLE. `npm run demo:media:upload` uploads these files through the existing Cloudinary integration and verifies each returned URL before writing `cloudinary-manifest.json`.
