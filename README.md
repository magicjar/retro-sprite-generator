<p align="center">
  <h1 align="center" style="font-weight: bold">Retro Sprite Generator</h1>
</p>

**Retro Sprite Generator** is a **Photoshop** script to export Frame Animation into sprite-sheet. It automaticaly transform all frame into one sprite-sheet file and save it as PNG. It also support image Offset & Spacing which are used by **Unity Game Engine**.

Starting from version 2.0.0, you can export layers or groups to individual files.

<table style="border-collapse: collapse;">
   <tr>
      <td>
         <img src="https://user-images.githubusercontent.com/9734293/110560468-a0df9d00-8178-11eb-9a18-21ae8e277c14.png" alt="Retro Sprite Generator Sprite-sheet Export">
      </td>
      <td>
         <img src="https://user-images.githubusercontent.com/9734293/110560483-a6d57e00-8178-11eb-9e89-5e5d38f5b086.png" alt="Retro Sprite Generator Files Export">
      </td>
    </tr>
</table>

## Feature
* Export frame animation into sprite-sheet (png only)
* Export Layers to Files (png and jpeg) (recursive)
* Export Groups to Files (png and jpeg) (non-recursive)
* Export specific frame
* Set column and row
* Scale and resample
* Offset and spacing

## Installation
 1. Close Photoshop.
 2. Copy **Retro Sprite Generator.jsx** to Photoshop scripts directory.
    - Windows
    ```
    C:\Program Files\Adobe\Photoshop CC 20xx\Presets\Scripts
    ```
    - Mac 
    ```
    Applications > Adobe Photoshop CC 20xx > Presets > Scripts
    ```
 3. Done.

## Usage
 1. Open your PSD.
    - You need to have at least 1 frame animation for sprite-sheet export.
 2. Run the script from **File > Export > Retro Sprite Generator**.
 3. Tweak the settings.
    - Open "Spritesheet Export" tab for export to sprite-sheet.
    - Open "Files Export" tab for export layers or groups to file.
 4. Click Export.

## Tested on
 * Adobe Photoshop CC 2019 64bit (Windows)
 * Adobe Photoshop CC 2021 64bit (Windows)

You have tested on other version and OS? You can edit this README and send me pull request.

## Found a Bug?
Please open a github issue.

## License
Copyright (c) 2021 - Fajar Setya Budi.

Code license is MIT.