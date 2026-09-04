from PIL import Image
import numpy as np
import os

def crop_and_clean_logos():
    input_path = r"d:\ADAM\project\scraping\scraper-gui\public\bahan-logo.png"
    if not os.path.exists(input_path):
        print("Bahan logo not found")
        return
        
    img = Image.open(input_path).convert("RGBA")
    
    # Exact coordinates based on image resolution 1486x445
    # To prevent ANY cutting, we add a safety margin of 5px
    box_dark = (70, 105, 670, 355)
    box_light = (800, 105, 1400, 355)
    
    # Process Dark Mode Logo (Left side - Dark Slate background)
    img_dark = img.crop(box_dark)
    data_dark = np.array(img_dark).astype(float)
    r, g, b, a = data_dark.T
    
    # Background color is roughly dark slate (e.g. #0B1329, R~11, G~19, B~41)
    # We remove anything that is very dark and desaturated.
    # Text is pure white (R,G,B > 240), Arrow is Orange (R>200).
    # So background is anything with R < 100 AND G < 100 AND B < 150.
    bg_mask_dark = (r < 100) & (g < 100) & (b < 150)
    data_dark[..., 3][bg_mask_dark.T] = 0
    
    final_dark = Image.fromarray(data_dark.astype(np.uint8))
    final_dark.save(r"d:\ADAM\project\scraping\scraper-gui\public\prospekto-logo-dark.png")
    
    # Process Light Mode Logo (Right side - White background)
    img_light = img.crop(box_light)
    data_light = np.array(img_light).astype(float)
    r, g, b, a = data_light.T
    
    # Background is white or light gray from shadow
    # Navy text is dark (R<100, G<100, B<150)
    # Orange arrow is orange (R>200, G>80, B<100)
    # Background is anything bright (R>180, G>180, B>180)
    bg_mask_light = (r > 180) & (g > 180) & (b > 180)
    data_light[..., 3][bg_mask_light.T] = 0
    
    final_light = Image.fromarray(data_light.astype(np.uint8))
    final_light.save(r"d:\ADAM\project\scraping\scraper-gui\public\prospekto-logo.png")
    
    # Extract Icons
    # Icon is the 'P' part on the left of each logo. Width is about 160px.
    icon_w = 170
    icon_dark = final_dark.crop((0, 0, icon_w, final_dark.height))
    icon_dark.save(r"d:\ADAM\project\scraping\scraper-gui\public\prospekto-icon-dark.png")
    
    icon_light = final_light.crop((0, 0, icon_w, final_light.height))
    icon_light.save(r"d:\ADAM\project\scraping\scraper-gui\public\prospekto-icon.png")

if __name__ == "__main__":
    crop_and_clean_logos()
