# Assistant-004 Remaster Drafts

These are generated design references, **not accepted animation assets**. Both current drafts are RGB images with a painted checkerboard, not transparent PNG sprites. Do not install them as pet sheets or describe them as finished HD animation.

这是角色设定草稿，**不是已验收的动画素材**。目前两张图都是带绘制棋盘格的 RGB 图片，不是真透明 PNG，不能当作最终宠物图集安装或宣称高清动画已完成。

![Two proportions and two outfits](assistant-004-design.png)

## Direction

- Two selectable characters: refined 3.5-head semi-chibi and slender 5-head anime.
- One original identity: chestnut hair, asymmetric fringe, blue-violet eyes, small teal barrette, skeptical scientist demeanor.
- Casual charcoal jacket and white scientist coat; the outfit changes with the animation state.
- Real 768x832 transparent frames, consistent full-canvas scale and registration, plus Codex v2 and v1 exports.
- User-supplied franchise reference artwork remains local and is not redistributed here.

## Generation Record

Tool: built-in `imagegen`. No API fallback or local background-removal method has been used. The current output did not satisfy the requested transparency. A change to solid-background generation plus local matting was proposed to the user and awaits confirmation.

### Design Sheet Prompt

Generate an ORIGINAL anime character production model sheet for Assistant-004. The supplied image is ONLY mood/color reference, NOT the character to reproduce. Invent a clearly distinct adult scientist character: chestnut-red long hair with an off-center curved fringe, two distinct tapered front locks, longer back hair to hips, a single tiny plain teal rectangular barrette on HER left, precise blue-violet eyes, subtle skeptical confident expression, NO smiley child face. Clean premium Japanese anime cel animation drawing with crisp fine dark aubergine outlines, restrained cool shadows, gorgeous eyes and individually readable hair locks, NOT pixel art, NOT 3D, NOT textured painting. Sheet has EXACTLY 4 separate full-body standing figures in equal 2 columns x2 rows, no borders or labels, ample separation. Top row: SAME character in refined semi-chibi 3.5-head proportions; left casual outfit, right white lab coat. Bottom row: SAME character in slender 5-head anime proportions; left casual outfit, right white lab coat. Casual: fitted charcoal short jacket with light gray collar worn properly on shoulders, pale collared shirt, narrow burgundy short tie, black high-waisted shorts, opaque charcoal stockings, clean black ankle boots with a tiny teal seam. Lab: same underneath plus bright white waist-to-mid-thigh split-tail scientist coat, tailored cuffs and simple lapels, no insignia. Four figures identical face/hair colors, adults with rational mature research assistant energy. All front-facing mild three-quarter view, arms relaxed, eyes forward, fixed level footing. Plain empty TRANSPARENT background with true alpha channel, no checkerboard painted in, no floor/shadows/text/logos/props, no speech bubbles. Full hair, hands and boots entirely inside each quadrant. Render at the highest native image resolution, ideally 3072x3328 or greater, not an upscaled low-res image. This is one unified character turnaround/design-reference sheet, not four separate images.

Actual output: 1205x1305 RGB. Accepted as a design reference only, not as HD frames.

### Single-Character Transparency Retry

Edit the provided character design sheet into ONE single full-body character: the TOP LEFT refined semi-chibi 3.5-head Assistant-004 in her CHARCOAL CASUAL JACKET, gray collared shirt, short burgundy tie, black tailored shorts, dark opaque stockings and ankle boots. This single image is her neutral idle animation keyframe. Precisely preserve her chestnut hair shape, single small teal hair barrette, skeptical blue-violet eyes and outfit. Face almost straight toward viewer, both boots on a level baseline, arms relaxed. Keep the entire character with 8% margin around head hair hands feet. Native canvas 768x832 or greater, high detail. IMPORTANT: remove ALL white-gray checkerboard from the reference. Return an actual RGBA PNG with alpha 0 in the empty background, not a picture of a checkerboard. No ground shadow, no pattern, no background color, no text. Actual transparency is required for a desktop sprite. Keep linework and opaque white shirt intact.

Actual output is recorded as a rejected transparency draft. Its filename is `assistant-004-casual-draft.png`.
