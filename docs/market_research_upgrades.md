# Feature Implementation Plan: Market-Driven NeuroBee Upgrades

This document outlines the technical implementation steps to integrate the refined features from our market research: Interactive Video Hooks for the gaze tracking test, and Pre-Recorded Video Uploads restricted to 1 minute. 

We will **not** alter the M-CHAT questionnaire to include generated images; the milestone text will remain exactly as it is.

## Proposed Changes

---

### Gaze Tracking Enhancements (Video Hooks)

To keep toddlers engaged (inspired by clinical GeoPref tests), we will replace the sterile moving dot with an engaging, pre-rendered asset.

#### `src/app/screen/page.tsx`
- We will take the generated `bouncing_bee_stimulus.png` and place it in `public/assets/`.
- In the `task === "gaze-follow"` rendering block, replace the simple dot `<div>` with an `<img src="/assets/bouncing_bee_stimulus.png" />`.
- The coordinate math (`dotX`) tracking remains the same to calculate latency, but the visual stimulus becomes highly engaging.

---

### Asynchronous Screening (Pre-Recorded Uploads)

To reduce toddler anxiety (inspired by Cognoa), we will allow parents to upload videos taken in a natural environment, strictly limited to 60 seconds to prevent device lag.

#### `src/app/screen/page.tsx`
- **State Management:** Introduce a new state `screeningMode` with values `"live"` or `"upload"`.
- **Intro Screen UI:** Add a secondary action button below "Begin Screening" labelled "Upload Pre-Recorded Video (Max 1 Minute)".
- **Upload Flow & 1-Minute Restriction:** 
  - Add a hidden `<input type="file" accept="video/mp4,video/quicktime,video/webm" />`.
  - When a file is selected, create a local object URL (`URL.createObjectURL(file)`) and load it into the `videoRef`.
  - **Validation:** Using the `videoRef.current.duration` property on the `onLoadedMetadata` event, we will check if the video exceeds 60 seconds. If it is longer, we will stop the flow and display an error message instructing the parent to trim the video to 1 minute.
- **Processing Logic:** 
  - Modify the `startDetection` RAF loop. When in "upload" mode, it will process frames directly from the uploaded video file instead of the live webcam stream.
  - Set the video to `playbackRate = 1.0`, and listen for the video's `ended` event to calculate the final composite neuro-scores automatically.
