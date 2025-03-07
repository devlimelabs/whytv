# WhyTV AI Prompt Optimization Recommendations

## Overview
This document proposes improvements to AI prompts used in the WhyTV Firebase functions. Each optimization is designed to enhance clarity, specificity, or performance while maintaining the core functionality.

## Channel Creation Prompt
**Current Prompt:**
```
Generate a unique, creative YouTube channel name based on this description: "${description}".
The name should be catchy, memorable, and directly relate to the content description.
```

**Recommended Improvements:**
```
You are naming a new channel for WhyTV, a platform that provides TV-like experiences with curated YouTube content.

Create a unique, memorable name for a channel based on this description: "${description}"

Guidelines:
- Keep the name concise (1-4 words)
- Make it catchy and easy to remember
- Ensure it clearly relates to the content theme
- Avoid generic terms like "Channel", "TV", or "Tube"
- Don't include special characters or symbols

Return ONLY the channel name with no explanations or additional text.
```

**Benefits:**
- Provides system context about WhyTV's purpose
- Sets clear constraints on name length and composition
- Explicitly discourages generic names and special characters
- Requests a direct response without explanations to improve parsing reliability

## Query Generation Prompt
**Current Prompt:**
```
whytv.ai provides a tv like experience for users to watch endless videos, powered by youtube. You are creating queries to populate the channel's playlist.
Generate 15-20 diverse, highly specific YouTube search queries based on this channel description:

Channel Name: "${channelName}"
Description: "${description}"

Guidelines:
- Queries should cover different aspects of the channel's theme
- Ensure queries are specific and likely to return relevant video results
- Avoid overly broad or generic queries
- Include variations in search terms
- DO NOT include the channel name in the queries

Return a JSON array of search queries.
```

**Recommended Improvements:**
```
You are creating search queries for WhyTV, a platform that provides TV-like experiences with curated YouTube content.

Task: Generate 15-20 diverse YouTube search queries to find videos for a channel with the following details:

Channel Name: "${channelName}"
Description: "${description}"

Query Guidelines:
- Each query should target a specific sub-topic within the channel's main theme
- Use specific terms that would return highly relevant results
- Include a mix of educational, entertaining, and informative content queries
- Vary query structures (questions, phrases, keywords)
- Ensure queries differ in scope (some narrow, some mid-range)
- DO NOT include the channel name in the queries
- Each query should be 2-6 words in length

Return ONLY a JSON array of strings containing your search queries.
Example: ["query 1", "query 2", "query 3"]
```

**Benefits:**
- Provides clearer performance expectations
- Specifies desired query length range
- Encourages varied content types and query structures
- Provides a clear example of the expected return format
- Adds specific sub-topic guidance to improve search relevance

## Video Selection Prompt
**Current Prompt:**
```
You are selecting videos for a YouTube Playlist with the following details:
Channel Name: "${channelName}"
Channel Description: "${channelDescription}"

Selection Criteria:
1. Choose videos that align closely with the channel's theme and description
2. Ensure diversity in content while maintaining thematic consistency
3. Avoid duplicates with existing channel videos
4. Select videos that are relevant to the channel's theme and description
5. Prioritize high-quality, engaging content

IMPORTANT: Return ONLY a JSON object with a field 'selectedVideoIds' containing an array of YouTube ID strings.
Do not include any other information in the response, just the IDs of videos that should be kept.

Here are the current videos in the playlist (review all properties to make your decision):
${currentVideos ? JSON.stringify(currentVideos) : 'None'}
```

**Recommended Improvements:**
```
You are the content curator for WhyTV, selecting videos for a channel playlist with these details:

Channel Name: "${channelName}"
Channel Description: "${channelDescription}"

Selection Guidelines:
1. Select videos that clearly match the channel's core theme
2. Prioritize videos with:
   - Higher view counts and engagement metrics (if available)
   - Diverse but complementary content
   - Clear, descriptive titles that match the theme
   - Recent publication dates (if available)
3. Eliminate videos that:
   - Are duplicates or too similar to others already selected
   - Have vague titles or descriptions
   - Fall outside the channel's primary theme
   - Appear to be low quality or promotional

Your selection should create a cohesive playlist that feels like a curated TV channel.

Return ONLY a JSON object formatted exactly like this: {"selectedVideoIds": ["id1", "id2", "id3"]}

Available videos:
${currentVideos ? JSON.stringify(currentVideos) : 'None'}
```

**Benefits:**
- Creates a clearer curator identity for the AI
- Provides more specific selection criteria with clear accept/reject guidelines
- Separates criteria more clearly into "select for" and "eliminate" categories
- Explicitly mentions the goal of cohesiveness
- Gives a precise JSON format example

## Playlist Finalization Prompt
**Current Prompt:**
```
whytv.ai provides a tv like experience for users to watch endless videos, powered by youtube. You are creating a cohesive playlist for a whytv.ai channel with the following details:
Channel Name: "${input.channelName}"
Channel Description: "${input.channelDescription}"

Available Videos: ${JSON.stringify(input.videos)}

Playlist Creation Guidelines:
1. Order videos to create a compelling, engaging narrative
2. Consider thematic progression and viewer retention
3. Ensure smooth transitions between videos
4. Highlight the channel's core message and theme
5. Optimize for viewer interest and watch time

Return a JSON object with a field 'orderedVideos' containing an array of video objects in the recommended playlist order.
Each video object should include 'youtubeId', and optionally 'title' and 'description'.
```

**Recommended Improvements:**
```
You are the programming director for WhyTV, arranging videos into a cohesive playlist that viewers will watch in sequence.

Channel Details:
- Name: "${input.channelName}"
- Description: "${input.channelDescription}"

Sequencing Strategy:
1. Start with an engaging, high-interest video that clearly establishes the channel's theme
2. Create a narrative flow that builds viewer interest throughout the playlist
3. Group related topics together while ensuring variety
4. Place longer videos between shorter ones to balance pacing
5. End with content that leaves viewers satisfied but interested in more

When arranging, consider:
- Content difficulty (start accessible, gradually introduce complexity)
- Emotional pacing (alternate between informative and entertaining)
- Visual variety (mix different visual styles throughout)

Return ONLY a JSON object formatted exactly like this:
{"orderedVideos": [{"youtubeId": "id1"}, {"youtubeId": "id2"}]}

Available Videos:
${JSON.stringify(input.videos)}
```

**Benefits:**
- Creates a programming director identity for the AI
- Emphasizes the sequential watching aspect of the playlist
- Provides more specific guidance on opening and closing videos
- Adds considerations for content difficulty, emotional pacing, and visual variety
- Gives a precise JSON format example