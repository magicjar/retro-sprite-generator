/**
 * Title: Retro Sprite Generator
 * Author: @dawntale
 * Url: https://github.com/dawntale
*/

#target photoshop
function RetroSpriteGenerator() {

    var dlg,
        sheetName,
        originalPath,
        frames = getFrameCount(),
        currentDoc,
        columns = 4,
        rows = 4,
        selectedScale = 0,
        scaleNumber = 0,
        selectedResample = 0,
        resampleMethod = 0,
        spriteWidth, // Original width
        spriteHeight, // Original height
        spriteResolution,
        padding = 0,
        offset = 0;

    function createSpriteSheet(onFinished) {
        try {
            dlg.hide();

            columns = parseInt(dlg.columns.text);
            rows = parseInt(dlg.rows.text);
            padding = parseInt(dlg.padding.text);
            offset = parseInt(dlg.offset.text);

            // Scaled width and height variable
            var scaledWidth = spriteWidth * scaleNumber;
            var scaledHeight = spriteHeight * scaleNumber;

            sheetName = sheetName + "_" + scaledWidth + "x" + scaledHeight;
            var startFrame = parseInt(dlg.startFrame.text);

            // Duplicate original Document
            var duppedDoc = app.activeDocument.duplicate();
            // Resize and Resample duplicated Document if scaling is true
            if (scaleNumber > 1) {
                duppedDoc.resizeImage(scaledWidth, scaledHeight, spriteResolution, resampleMethod);
            }

            // Create temporary Document
            var tempDoc = app.documents.add(scaledWidth, scaledHeight, spriteResolution, sheetName + "_tmp");

            // Create sprite sheet Document
            var spriteSheetDoc = app.documents.add((scaledWidth * columns) + (padding * (columns - 1)), (scaledHeight * rows) + (padding * (rows - 1)), spriteResolution, sheetName + "_spritesheet");

            var cellSize = getSelectionShape(scaledWidth, 0, scaledHeight, 0);

            if (dlg.startfromtop.value == true) {
                var currentColumn = 0,
                    currentRow = 0;
            } else {
                var currentColumn = 0,
                    currentRow = rows - 1;
            }


            if (frames > 0) {
                for (var i = 0; i < frames; i++) {
                    app.activeDocument = duppedDoc;
                    selectFrame(startFrame + i);
                    app.activeDocument.selection.select(cellSize);

                    // Only way at the moment to check for empty selection is to catch the exception
                    var selectionIsEmpty = false;
                    try {
                        app.activeDocument.selection.copy(true);
                    } catch (ex) {
                        selectionIsEmpty = true;
                    }

                    if (!selectionIsEmpty) {
                        app.activeDocument = tempDoc;
                        app.activeDocument.selection.select(cellSize);

                        // paste in place might not work in versions below CS5
                        pasteInPlace();
                        var layer = app.activeDocument.activeLayer.duplicate(spriteSheetDoc);

                        app.activeDocument = spriteSheetDoc;

                        layer.translate((currentColumn * scaledWidth) + (currentColumn * padding), (currentRow * scaledHeight) + (currentRow * padding));
                    }

                    currentColumn++;

                    if (currentColumn >= columns) {
                        if (dlg.startfromtop.value == true) {
                            currentRow++;
                            currentColumn = 0;
                        } else {
                            currentRow--;
                            currentColumn = 0;
                        }
                    }
                }

                app.activeDocument = tempDoc;
                app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);

                app.activeDocument = duppedDoc;
                app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);

                app.activeDocument = spriteSheetDoc;

                // Adding offset
                if (offset > 0)
                    app.activeDocument.resizeCanvas(spriteSheetDoc.width + offset * 2, spriteSheetDoc.height + offset * 2, AnchorPosition.MIDDLECENTER);

                // Remove the default background layer
                app.activeDocument.artLayers.getByName(app.activeDocument.backgroundLayer.name).remove();

                if (onFinished)
                    onFinished(spriteSheetDoc, currentDoc);
            }
            exit();
        } catch (ex) {
            alert("An error occured, please submit a bug report. Error: " + ex);
        }
    }

    // Count the number of frames in the timeline.
    function getFrameCount() {
        for (var f = 1; f < 999; f++)
            if (selectFrame(f) == false)
                return f - 1;

        return 0;
    }

    function selectFrame(number) {
        try {
            var desc = new ActionDescriptor();
            var ref = new ActionReference();

            var idslct = charIDToTypeID("slct");
            var idnull = charIDToTypeID("null");
            var idanimationFrameClass = stringIDToTypeID("animationFrameClass");

            ref.putIndex(idanimationFrameClass, number);
            desc.putReference(idnull, ref);

            executeAction(idslct, desc, DialogModes.NO);
            return true;
        } catch (e) {
            //
        }
        return false;
    }

    function getSelectionShape(width, column, height, row) {
        var shape = [
            [column * width, row * height], // top left
            [column * width, row * height + height], // bottom left
            [column * width + width, row * height + height], // bottom right
            [column * width + width, row * height] // top right
        ];

        return shape;
    }

    function pasteInPlace() {
        var idpast = charIDToTypeID("past");
        var desc4 = new ActionDescriptor();
        var idinPlace = stringIDToTypeID("inPlace");
        desc4.putBoolean(idinPlace, true);
        var idAntA = charIDToTypeID("AntA");
        var idAnnt = charIDToTypeID("Annt");
        var idAnno = charIDToTypeID("Anno");
        desc4.putEnumerated(idAntA, idAnnt, idAnno);
        executeAction(idpast, desc4, DialogModes.NO);
    }

    /***
    /* Window setup and prep calculations
    /**/
    function calculateColRowVals() {
        rows = Math.floor(Math.sqrt(frames));
        columns = Math.ceil(frames / rows);
    }

    function onFramesChange(e) {
        frames = parseInt(dlg.endFrame.text) - parseInt(dlg.startFrame.text) + 1;

        calculateColRowVals();

        dlg.rows.text = rows;
        dlg.columns.text = columns;
    }

    function saveAsPNG() {
        if (dlg.sameFolder.value == true)
            var exportedFile = new File(originalPath + "/" + sheetName + ".png");
        else
            var exportedFile = File.saveDialog("Save as PNG", "*.png");

        if (exportedFile == null)
            return;

        var finished = function (spriteSheet, originalDoc) {
            var o = new ExportOptionsSaveForWeb();
            o.format = SaveDocumentType.PNG;
            o.PNG8 = dlg.smallbit.value;
            o.transparency = dlg.transp.value;
            o.interlaced = false;
            o.includeProfile = false;
            o.quality = 100;

            spriteSheet.exportDocument(exportedFile, ExportType.SAVEFORWEB, o);

            spriteSheet.close(SaveOptions.DONOTSAVECHANGES);
            app.activeDocument = originalDoc;
        }

        createSpriteSheet(finished);
    }

    function exit() {
        dlg.close();
    }

    function createWindow() {
        dlg = new Window('dialog', 'Retro Sprite Generator');

        // Frames
        dlg.framePanel = dlg.add('panel', undefined, "Frames");
        dlg.framePanel.alignment = ['fill', 'top'];

        // Frame Preferences
        dlg.frameGroup = dlg.framePanel.add('group');
        dlg.frameGroup.alignment = ['left', 'top'];

        dlg.frameGroup.add('StaticText', [0, 0, 60, 25], 'Start frame:');
        dlg.startFrame = dlg.frameGroup.add('EditText', undefined, 1);
        dlg.startFrame.characters = 5;
        dlg.startFrame.onChange = onFramesChange;

        dlg.frameGroup.add('StaticText', [0, 0, 60, 25], 'End frame:');
        dlg.endFrame = dlg.frameGroup.add('EditText', undefined, frames);
        dlg.endFrame.characters = 5;
        dlg.endFrame.onChange = onFramesChange;

        // Sizes
        dlg.dimensionsPanel = dlg.add('panel', undefined, "Sizes");
        dlg.dimensionsPanel.alignment = ['fill', 'top'];

        // Size Preferences
        dlg.dimensionsGroup = dlg.dimensionsPanel.add('group');
        dlg.dimensionsGroup.alignment = ['left', 'top'];

        dlg.dimensionsGroup.add('StaticText', [0, 0, 60, 25], 'Columns:');
        dlg.columns = dlg.dimensionsGroup.add('EditText', undefined, columns);
        dlg.columns.characters = 5;
        dlg.columns.helpTip = 'Number of columns';

        dlg.dimensionsGroup.add('StaticText', [0, 0, 60, 25], 'Rows:');
        dlg.rows = dlg.dimensionsGroup.add('EditText', undefined, rows);
        dlg.rows.characters = 5;
        dlg.rows.helpTip = 'Number of rows';

        // Image Scale
        dlg.imageScalePanel = dlg.add('panel', undefined, "Image Scale");
        dlg.imageScalePanel.alignment = ['fill', 'top'];

        // Image Scale Preferences
        dlg.imageScaleGroup = dlg.imageScalePanel.add('group');
        dlg.imageScaleGroup.alignment = ['left', 'top'];

        dlg.imageScaleGroup.add('StaticText', [0, 0, 60, 25], 'Scale:');
        dlg.ddScaleNumber = dlg.imageScaleGroup.add("dropdownlist", undefined, ['Default', '@2x', '@3x']);

        dlg.ddScaleNumber.onChange = function () {
            // get scale number
            selectedScale = this.selection.index + 1;

            switch (selectedScale) {
                case 1: // Default / no scale
                    scaleNumber = 1;
                    break;
                case 2: // 2x scale
                    scaleNumber = 2;
                    break;
                case 3: // 3x scale
                    scaleNumber = 3;
                    break;
            }
        }

        // Resample Preferences
        dlg.imageScaleGroup.add('StaticText', undefined, 'Resample Method:');
        dlg.ddResampleMethod = dlg.imageScaleGroup.add("dropdownlist", undefined, ['Automatic', 'Bicubic', 'Bicubic Automatic', 'Bicubic Sharper', 'Bicubic Smoother', 'Bilinear', 'Nearest Neighbor', 'None', 'Preserve Details']);

        dlg.ddResampleMethod.onChange = function () {
            selectedResample = this.selection.index;
            switch (selectedResample) {
                case 0:
                    resampleMethod = ResampleMethod.AUTOMATIC;
                    break;
                case 1:
                    resampleMethod = ResampleMethod.BICUBIC;
                    break;
                case 2:
                    resampleMethod = ResampleMethod.BICUBICAUTOMATIC;
                    break;
                case 3:
                    resampleMethod = ResampleMethod.BICUBICSHARPER;
                    break;
                case 4:
                    resampleMethod = ResampleMethod.BICUBICSMOOTHER;
                    break;
                case 5:
                    resampleMethod = ResampleMethod.BILINEAR;
                    break;
                case 6:
                    resampleMethod = ResampleMethod.NEARESTNEIGHBOR;
                    break;
                case 7:
                    resampleMethod = ResampleMethod.NONE;
                    break;
                case 8:
                    resampleMethod = ResampleMethod.PRESERVEDETAILS;
                    break;
            }
        }

        // Spacing
        dlg.spacoffPanel = dlg.add('panel', undefined, "Spacing");
        dlg.spacoffPanel.alignment = ['fill', 'top'];

        // Spacing Preferences
        dlg.spacingGroup = dlg.spacoffPanel.add('group');
        dlg.spacingGroup.alignment = ['left', 'top'];

        dlg.spacingGroup.add('StaticText', [0, 0, 60, 25], 'Offset:');
        dlg.offset = dlg.spacingGroup.add('EditText', undefined, offset);
        dlg.offset.characters = 5;
        dlg.offset.helpTip = 'Outer space around sprite sheet';

        dlg.spacingGroup.add('StaticText', [0, 0, 60, 25], 'Padding:');
        dlg.padding = dlg.spacingGroup.add('EditText', undefined, padding);
        dlg.padding.characters = 5;
        dlg.padding.helpTip = 'Space between each images';

        // Start From
        dlg.startFromPanel = dlg.add('panel', undefined, "Start From");
        dlg.startFromPanel.alignment = ['fill', 'top'];

        // Option Preferences
        dlg.startFromGroup = dlg.startFromPanel.add('group');
        dlg.startFromGroup.alignment = ['left', 'top'];

        dlg.startfromtop = dlg.startFromGroup.add('radiobutton', undefined, 'Top');
        dlg.startfromtop.value = true;
        dlg.startfrombottom = dlg.startFromGroup.add('radiobutton', undefined, 'Bottom');
        dlg.startfrombottom.value = false;

        // Options
        dlg.optionsPanel = dlg.add('panel', undefined, "Export Options");
        dlg.optionsPanel.alignment = ['fill', 'top'];

        // Option Preferences
        dlg.optionsGroup = dlg.optionsPanel.add('group');
        dlg.optionsGroup.alignment = ['left', 'top'];

        dlg.transp = dlg.optionsGroup.add('checkbox', undefined, 'Transparency');
        dlg.transp.value = true;

        dlg.smallbit = dlg.optionsGroup.add('checkbox', undefined, 'Smaller File (8-bit)');
        dlg.smallbit.value = false;

        // Action Buttons
        dlg.buttons = dlg.add('group');
        dlg.buttons.cancel = dlg.buttons.add('button', undefined, 'Cancel');
        dlg.buttons.cancel.onClick = exit;

        dlg.buttons.saveAsPNGBtn = dlg.buttons.add('button', undefined, 'Save as PNG');
        dlg.buttons.saveAsPNGBtn.onClick = saveAsPNG;

        dlg.sameFolderGroup = dlg.add('group');
        dlg.sameFolder = dlg.sameFolderGroup.add('Checkbox', undefined, 'Save in same folder');
        dlg.sameFolder.value = false;

        dlg.ddScaleNumber.items[selectedScale].selected = true;
        dlg.ddResampleMethod.items[selectedResample].selected = true;

        dlg.show();

    }

    function init() {
        if (frames == 0) {
            alert("No animation frames were found.\nThis script requires minimum of 1 frame animation to create a sprite sheet.");
            return;
        }

        currentDoc = app.activeDocument;
        originalPath = currentDoc.path;
        sheetName = currentDoc.name.split('.')[0];
        spriteWidth = currentDoc.width;
        spriteHeight = currentDoc.height;
        spriteResolution = currentDoc.resolution;

        calculateColRowVals();
        createWindow();
    }

    init();
}

try {
    if (app && app.activeDocument) {
        var savedPrefs = {
            typeUnits: app.preferences.typeUnits,
            rulerUnits: app.preferences.rulerUnits
        };

        app.preferences.typeUnits = TypeUnits.PIXELS;
        app.preferences.rulerUnits = Units.PIXELS;

        var spriteGenerator = new RetroSpriteGenerator();

        app.preferences.typeUnits = savedPrefs.typeUnits;
        app.preferences.rulerUnits = savedPrefs.rulerUnits;
    }
} catch (e) {
    alert('There is no active document.');
}
