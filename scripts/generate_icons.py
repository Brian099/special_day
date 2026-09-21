import os
import math
from PIL import Image, ImageDraw, ImageFont

def create_gradient_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Rounded rectangle background with gradient
    corner_radius = int(size * 0.22)
    
    # Create gradient
    for y in range(size):
        for x in range(size):
            # Distance for rounded corner check
            # Smooth gradient from Rose/Coral #FF416C to Violet/Indigo #8A2387
            ratio_x = x / size
            ratio_y = y / size
            
            r = int(255 - ratio_y * 110 + ratio_x * 20)
            g = int(65 + ratio_y * 10 - ratio_x * 30)
            b = int(108 + ratio_y * 90 + ratio_x * 40)
            
            # Draw rounded rect mask
            inside = False
            if corner_radius <= x <= size - corner_radius or corner_radius <= y <= size - corner_radius:
                inside = True
            else:
                # check 4 corners
                cx = corner_radius if x < corner_radius else size - corner_radius
                cy = corner_radius if y < corner_radius else size - corner_radius
                if math.sqrt((x - cx)**2 + (y - cy)**2) <= corner_radius:
                    inside = True
            
            if inside:
                img.putpixel((x, y), (r, g, b, 255))
    
    draw = ImageDraw.Draw(img)
    
    # Calendar Top bar
    pad = int(size * 0.18)
    w = size - pad * 2
    h = size - pad * 2
    top = pad
    left = pad
    
    # White translucent card inside
    card_margin = int(size * 0.20)
    card_rad = int(size * 0.10)
    
    card_img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    card_draw = ImageDraw.Draw(card_img)
    card_draw.rounded_rectangle(
        [card_margin, card_margin, size - card_margin, size - card_margin],
        radius=card_rad,
        fill=(255, 255, 255, 235)
    )
    
    # Calendar header (Rose)
    hdr_h = int(size * 0.16)
    card_draw.rounded_rectangle(
        [card_margin, card_margin, size - card_margin, card_margin + hdr_h],
        radius=card_rad,
        fill=(235, 60, 100, 255)
    )
    
    # Binder rings
    ring_r = int(size * 0.035)
    r_y = card_margin
    card_draw.ellipse([card_margin + int(w*0.25) - ring_r, r_y - ring_r, card_margin + int(w*0.25) + ring_r, r_y + ring_r*2], fill=(255, 255, 255, 255))
    card_draw.ellipse([size - card_margin - int(w*0.25) - ring_r, r_y - ring_r, size - card_margin - int(w*0.25) + ring_r, r_y + ring_r*2], fill=(255, 255, 255, 255))
    
    # Heart icon in center
    cx = size // 2
    cy = size // 2 + int(size * 0.07)
    hr = int(size * 0.12)
    
    # Draw heart
    card_draw.ellipse([cx - hr, cy - int(hr*0.7), cx, cy + int(hr*0.3)], fill=(245, 60, 100, 255))
    card_draw.ellipse([cx, cy - int(hr*0.7), cx + hr, cy + int(hr*0.3)], fill=(245, 60, 100, 255))
    card_draw.polygon([
        (cx - int(hr*0.95), cy - int(hr*0.1)),
        (cx + int(hr*0.95), cy - int(hr*0.1)),
        (cx, cy + int(hr*0.9))
    ], fill=(245, 60, 100, 255))
    
    # Combine
    img = Image.alpha_composite(img, card_img)
    return img

os.makedirs("d:/coding/纪念日提醒/app/ui", exist_ok=True)
os.makedirs("d:/coding/纪念日提醒/scripts", exist_ok=True)

img_256 = create_gradient_icon(256)
img_256.save("d:/coding/纪念日提醒/ICON_256.PNG", "PNG")

img_64 = create_gradient_icon(64)
img_64.save("d:/coding/纪念日提醒/ICON.PNG", "PNG")

img_entry = create_gradient_icon(128)
img_entry.save("d:/coding/纪念日提醒/app/ui/icon.png", "PNG")

print("Generated ICON.PNG (64x64), ICON_256.PNG (256x256), and app/ui/icon.png successfully!")
