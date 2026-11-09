# Study notes: video streaming

## Key trade-offs
- **Bitrate ladder.** More renditions give a better fit for every connection and cost transcoding time and storage for every video. A fixed ladder is simple, while a per-title ladder saves bandwidth for easy content and needs analysis. Spend the extra effort where a video will be watched a lot.
- **Segment length.** Short segments let players switch quality quickly and start sooner, and increase request count and per-segment overhead. Long segments are more efficient and slower to adapt. A few seconds is typical, and you should say why.
- **Transcode everything now or lazily.** Producing every rendition at upload makes playback ready at once and wastes work on videos nobody watches. Producing popular renditions first and others on demand saves compute and makes the first viewer of an old video wait. The long tail makes this decision important.
- **Codec choice.** Newer codecs cut bandwidth substantially and take much more compute to encode and are not supported on every device. Offering several codecs multiplies storage.
- **CDN strategy.** Filling the cache on the first request is automatic and means the first viewers of a new video hit the origin. Pushing popular or predicted content to edges ahead of time costs bandwidth and spares the origin. A tiered cache between edge and origin absorbs misses.

## Common mistakes
- **Transcoding a whole upload on one machine.** The work takes longer than the video, which breaks the processing-time requirement.
- **Serving one large file.** Without segments, a player cannot switch quality or seek cheaply, and a viewer on a weak connection stalls.
- **Letting the server pick quality.** The client sees its own throughput and buffer, so the choice belongs there, using the manifest the server provides.
- **Treating the CDN as magic.** A new, popular video starts with empty caches, and without a plan the origin takes the first wave of traffic.
- **No retry or validation in the pipeline.** Uploads fail halfway and transcodes crash. Make steps idempotent and resumable, and verify the output before publishing.
