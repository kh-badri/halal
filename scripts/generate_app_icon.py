import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import math
import os

def generate_modern_icons():
    # 1. GENERATE MODERN SVG
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Background Radiant Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FF6384" />
      <stop offset="45%" stop-color="#F43F5E" />
      <stop offset="100%" stop-color="#BE123C" />
    </linearGradient>

    <!-- Center Soft Aura -->
    <radialGradient id="centerGlow" cx="50%" cy="45%" r="55%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.32" />
      <stop offset="60%" stop-color="#FFA8BA" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#BE123C" stop-opacity="0" />
    </radialGradient>

    <!-- Platinum Ring Metallic Gradient -->
    <linearGradient id="platinum" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="30%" stop-color="#E2E8F0" />
      <stop offset="55%" stop-color="#FFFFFF" />
      <stop offset="80%" stop-color="#94A3B8" />
      <stop offset="100%" stop-color="#F8FAFC" />
    </linearGradient>

    <!-- Warm Champagne Gold Ring Gradient -->
    <linearGradient id="champagneGold" x1="0%" y1="20%" x2="100%" y2="80%">
      <stop offset="0%" stop-color="#FFFBEB" />
      <stop offset="25%" stop-color="#FCD34D" />
      <stop offset="50%" stop-color="#F59E0B" />
      <stop offset="75%" stop-color="#FEF08A" />
      <stop offset="100%" stop-color="#D97706" />
    </linearGradient>

    <!-- Sparkling Diamond Glow -->
    <radialGradient id="diamondGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="40%" stop-color="#FEF08A" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#F43F5E" stop-opacity="0" />
    </radialGradient>

    <!-- Drop Shadows -->
    <filter id="shadowRing" x="-20%" y="-20%" width="150%" height="150%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#4C0519" flood-opacity="0.45" />
    </filter>

    <filter id="sparkleGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <!-- Base Squircle with Luxury Gradient -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)" />
  <rect width="512" height="512" rx="128" fill="url(#centerGlow)" />
  
  <!-- Subtle Inner Glass Specular Border -->
  <rect x="2" y="2" width="508" height="508" rx="126" fill="none" stroke="#FFFFFF" stroke-opacity="0.22" stroke-width="2.5" />

  <!-- Smooth Road / Crescent Ribbon of Destiny -->
  <path d="M 96 384 C 180 430, 332 430, 416 384 C 340 398, 172 398, 96 384 Z" 
        fill="#FFFFFF" fill-opacity="0.18" filter="url(#shadowRing)" />

  <!-- Back Segment of Gold Ring (Passes behind Platinum Ring) -->
  <circle cx="296" cy="276" r="92" fill="none" stroke="url(#champagneGold)" stroke-width="26" filter="url(#shadowRing)" />

  <!-- Full Platinum Ring (Interlocks with Gold Ring) -->
  <circle cx="216" cy="276" r="92" fill="none" stroke="url(#platinum)" stroke-width="26" filter="url(#shadowRing)" />

  <!-- Front Arc Overlap of Gold Ring (To achieve authentic 3D Interlocking) -->
  <path d="M 296 184 A 92 92 0 0 1 388 276 A 92 92 0 0 1 316 364" 
        fill="none" stroke="url(#champagneGold)" stroke-width="26" stroke-linecap="round" />

  <!-- Brilliant Radiant Diamond on the Crown (Where the Rings Join) -->
  <g transform="translate(256, 176)">
    <!-- Aura Glow Behind Gem -->
    <circle cx="0" cy="0" r="38" fill="url(#diamondGlow)" />

    <!-- 4 Major Sparkling Rays -->
    <polygon points="0,-48 11,-11 48,0 11,11 0,48 -11,11 -48,0 -11,-11" fill="#FFFFFF" filter="url(#sparkleGlow)" />

    <!-- 4 Diagonal Accent Rays -->
    <polygon points="0,-26 6,-6 26,0 6,6 0,26 -6,6 -26,0 -6,-6" fill="#FEF08A" opacity="0.9" />

    <!-- Pure Diamond Core Facet -->
    <polygon points="0,-16 12,-4 0,16 -12,-4" fill="#FFFFFF" />
    <polygon points="0,-16 0,16 12,-4" fill="#E2E8F0" opacity="0.6" />
    <circle cx="0" cy="0" r="4" fill="#FFFFFF" />
  </g>

  <!-- Tiny Starlight Accents -->
  <circle cx="160" cy="180" r="3" fill="#FFFFFF" opacity="0.7" />
  <circle cx="352" cy="190" r="3.5" fill="#FFFBEB" opacity="0.8" />
  <circle cx="390" cy="230" r="2" fill="#FFFFFF" opacity="0.6" />
</svg>
'''

    os.makedirs('public/icons', exist_ok=True)
    with open('public/icons/icon.svg', 'w', encoding='utf-8') as f:
        f.write(svg_content.strip())
    print("Created public/icons/icon.svg")

    # 2. RENDER ULTRA HIGH RESOLUTION PNGs WITH PILLOW & NUMPY
    # We render at 1024x1024 then downscale with Lanczos for super-crisp anti-aliased output
    def render_canvas(size=1024, maskable=False):
        img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        
        # Grid coordinates
        y, x = np.mgrid[0:size, 0:size]
        
        # 1. Background gradient (Vibrant Rose-Pink to Ruby Red)
        t = (x / size * 0.45) + (y / size * 0.55)
        
        c1 = np.array([255, 99, 132], dtype=float)
        c2 = np.array([190, 18, 60], dtype=float)
        
        bg_r = c1[0] * (1 - t) + c2[0] * t
        bg_g = c1[1] * (1 - t) + c2[1] * t
        bg_b = c1[2] * (1 - t) + c2[2] * t
        
        dx = (x - size * 0.5) / (size * 0.5)
        dy = (y - size * 0.42) / (size * 0.5)
        dist = np.sqrt(dx*dx + dy*dy)
        center_glow = np.clip(1.0 - dist, 0.0, 1.0) * 0.35
        
        bg_r = np.clip(bg_r + (255 - bg_r) * center_glow, 0, 255)
        bg_g = np.clip(bg_g + (210 - bg_g) * center_glow, 0, 255)
        bg_b = np.clip(bg_b + (230 - bg_b) * center_glow, 0, 255)
        
        bg_array = np.dstack((bg_r, bg_g, bg_b, np.full((size, size), 255))).astype(np.uint8)
        bg_img = Image.fromarray(bg_array, mode="RGBA")
        
        if not maskable:
            corner_radius = int(size * 0.25)
            mask = Image.new("L", (size, size), 0)
            mask_draw = ImageDraw.Draw(mask)
            mask_draw.rounded_rectangle([0, 0, size, size], radius=corner_radius, fill=255)
            
            img.paste(bg_img, (0, 0), mask)
            
            rim = Image.new("RGBA", (size, size), (0, 0, 0, 0))
            rim_draw = ImageDraw.Draw(rim)
            rim_draw.rounded_rectangle([2, 2, size - 2, size - 2], radius=corner_radius - 2, outline=(255, 255, 255, 60), width=max(2, size // 256))
            img = Image.alpha_composite(img, rim)
        else:
            img = bg_img

        art = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        art_draw = ImageDraw.Draw(art)
        
        scale = 0.72 if maskable else 0.88
        cx = size * 0.5
        cy = size * 0.54
        
        r_radius = int(size * 0.18 * scale)
        stroke_w = int(size * 0.052 * scale)
        offset_x = int(size * 0.08 * scale)
        
        p1_center = (int(cx - offset_x), int(cy))
        g1_center = (int(cx + offset_x), int(cy))
        
        shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)
        s_offset = int(size * 0.02)
        
        shadow_draw.ellipse(
            [p1_center[0] - r_radius, p1_center[1] - r_radius + s_offset,
             p1_center[0] + r_radius, p1_center[1] + r_radius + s_offset],
            outline=(50, 0, 15, 120), width=stroke_w
        )
        shadow_draw.ellipse(
            [g1_center[0] - r_radius, g1_center[1] - r_radius + s_offset,
             g1_center[0] + r_radius, g1_center[1] + r_radius + s_offset],
            outline=(50, 0, 15, 120), width=stroke_w
        )
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=int(size * 0.025)))
        img = Image.alpha_composite(img, shadow)

        # Draw Back Gold Ring
        art_draw.ellipse(
            [g1_center[0] - r_radius, g1_center[1] - r_radius,
             g1_center[0] + r_radius, g1_center[1] + r_radius],
            outline=(245, 158, 11, 255), width=stroke_w
        )
        art_draw.ellipse(
            [g1_center[0] - r_radius + 2, g1_center[1] - r_radius + 2,
             g1_center[0] + r_radius - 2, g1_center[1] + r_radius - 2],
            outline=(254, 240, 138, 230), width=max(2, stroke_w // 4)
        )

        # Draw Full Platinum Ring (Left)
        art_draw.ellipse(
            [p1_center[0] - r_radius, p1_center[1] - r_radius,
             p1_center[0] + r_radius, p1_center[1] + r_radius],
            outline=(241, 245, 249, 255), width=stroke_w
        )
        art_draw.ellipse(
            [p1_center[0] - r_radius + 2, p1_center[1] - r_radius + 2,
             p1_center[0] + r_radius - 2, p1_center[1] + r_radius - 2],
            outline=(255, 255, 255, 240), width=max(2, stroke_w // 3)
        )

        # Draw Front Interlocking Arc of Gold Ring
        bbox_gold = [g1_center[0] - r_radius, g1_center[1] - r_radius,
                     g1_center[0] + r_radius, g1_center[1] + r_radius]
        art_draw.arc(bbox_gold, start=-20, end=110, fill=(245, 158, 11, 255), width=stroke_w)
        art_draw.arc([bbox_gold[0]+2, bbox_gold[1]+2, bbox_gold[2]-2, bbox_gold[3]-2],
                     start=-20, end=110, fill=(254, 240, 138, 240), width=max(2, stroke_w // 4))

        # Draw Brilliant Crown Diamond / Star
        star_x = cx
        star_y = cy - int(r_radius * 0.98)
        
        flare_r = int(size * 0.095 * scale)
        flare_inner = int(flare_r * 0.22)
        
        points_major = [
            (star_x, star_y - flare_r),
            (star_x + flare_inner, star_y - flare_inner),
            (star_x + flare_r, star_y),
            (star_x + flare_inner, star_y + flare_inner),
            (star_x, star_y + flare_r),
            (star_x - flare_inner, star_y + flare_inner),
            (star_x - flare_r, star_y),
            (star_x - flare_inner, star_y - flare_inner),
        ]
        
        star_glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        star_glow_draw = ImageDraw.Draw(star_glow)
        glow_rad = int(flare_r * 0.8)
        star_glow_draw.ellipse(
            [star_x - glow_rad, star_y - glow_rad, star_x + glow_rad, star_y + glow_rad],
            fill=(254, 240, 138, 180)
        )
        star_glow = star_glow.filter(ImageFilter.GaussianBlur(radius=int(size * 0.02)))
        img = Image.alpha_composite(img, star_glow)

        art_draw.polygon(points_major, fill=(255, 255, 255, 255))
        
        diag_r = int(flare_r * 0.55)
        diag_inner = int(diag_r * 0.3)
        points_diag = [
            (star_x + diag_r * 0.7, star_y - diag_r * 0.7),
            (star_x + diag_inner * 0.2, star_y - diag_inner),
            (star_x + diag_r * 0.7, star_y + diag_r * 0.7),
            (star_x + diag_inner, star_y + diag_inner * 0.2),
            (star_x - diag_r * 0.7, star_y + diag_r * 0.7),
            (star_x - diag_inner * 0.2, star_y + diag_inner),
            (star_x - diag_r * 0.7, star_y - diag_r * 0.7),
            (star_x - diag_inner, star_y - diag_inner * 0.2),
        ]
        art_draw.polygon(points_diag, fill=(254, 243, 199, 230))
        
        core_r = int(size * 0.025 * scale)
        art_draw.ellipse(
            [star_x - core_r, star_y - core_r, star_x + core_r, star_y + core_r],
            fill=(255, 255, 255, 255)
        )
        
        # Tiny subtle sparkles
        art_draw.ellipse([cx - int(size * 0.2), cy - int(size * 0.18), cx - int(size * 0.2) + 6, cy - int(size * 0.18) + 6], fill=(255, 255, 255, 180))
        art_draw.ellipse([cx + int(size * 0.22), cy - int(size * 0.16), cx + int(size * 0.22) + 8, cy - int(size * 0.16) + 8], fill=(254, 240, 138, 200))
        art_draw.ellipse([cx + int(size * 0.28), cy - int(size * 0.05), cx + int(size * 0.28) + 5, cy - int(size * 0.05) + 5], fill=(255, 255, 255, 160))

        img = Image.alpha_composite(img, art)
        return img

    print("Rendering 512x512 standard icon...")
    icon_512 = render_canvas(size=1024, maskable=False).resize((512, 512), Image.Resampling.LANCZOS)
    icon_512.save("public/icons/icon-512x512.png", "PNG", optimize=True)

    print("Rendering 192x192 standard icon...")
    icon_192 = icon_512.resize((192, 192), Image.Resampling.LANCZOS)
    icon_192.save("public/icons/icon-192x192.png", "PNG", optimize=True)

    print("Rendering 512x512 maskable icon...")
    icon_maskable = render_canvas(size=1024, maskable=True).resize((512, 512), Image.Resampling.LANCZOS)
    icon_maskable.save("public/icons/icon-maskable.png", "PNG", optimize=True)

    print("Generating favicon.ico...")
    icon_48 = icon_512.resize((48, 48), Image.Resampling.LANCZOS)
    icon_32 = icon_512.resize((32, 32), Image.Resampling.LANCZOS)
    icon_16 = icon_512.resize((16, 16), Image.Resampling.LANCZOS)
    icon_48.save("public/favicon.ico", format="ICO", sizes=[(48, 48), (32, 32), (16, 16)])

    print("All icons successfully generated!")

if __name__ == "__main__":
    generate_modern_icons()
