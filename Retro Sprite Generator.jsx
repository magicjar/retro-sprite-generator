/**
 * Title: Retro Sprite Generator
 * Author: @dawntale
 * Url: https://github.com/dawntale
*/

/*

// BEGIN__HARVEST_EXCEPTION_ZSTRING

<javascriptresource>
    <name>$$$/JavaScripts/RetroSpriteGenerator/Menu=Retro Sprite Generator...</name>
    <category>scriptexport</category>
    <menu>export</menu>
    <enableinfo>true</enableinfo>
    <eventid>cf34b502-2013-4d07-8431-1dfd634ee0cd</eventid>
</javascriptresource>

// END__HARVEST_EXCEPTION_ZSTRING

*/


#target photoshop


///////////////////////////////////////////////////////////////////////////////
// First Checkpoint
///////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////
// Functions
///////////////////////////////////////////////////////////////////////////////

function RetroSpriteGenerator() {
    var w,
        spriteTab,
        singleTab,
        tabIndex = 0,
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
        offset = 0,
        singleExportType = 0,
        sameFolder,
        smallbit,
        transparency;

    ///////////////////////////////////////////////////////////////////////////////
    // First Checkpoint
    ///////////////////////////////////////////////////////////////////////////////

    init();

    function init() {
        if (frames == 0) {
            tabIndex = 1;
        }

        currentDoc = app.activeDocument;
        originalPath = currentDoc.path;
        sheetName = originalDocName = currentDoc.name.split('.')[0];
        spriteWidth = currentDoc.width;
        spriteHeight = currentDoc.height;
        spriteResolution = currentDoc.resolution;

        calculateColRowVals();
        createWindow();
    }

    function createSpriteSheet(onFinished) {
        try {
            if (frames == 0) {
                alert("No animation frames were found.\nThis script requires minimum of 1 frame animation to create a sprite sheet.");
                return;
            }

            w.hide();

            columns = parseInt(w.columns.text);
            rows = parseInt(w.rows.text);
            padding = parseInt(w.padding.text);
            offset = parseInt(w.offset.text);

            // Scaled width and height variable
            var scaledWidth = spriteWidth * scaleNumber;
            var scaledHeight = spriteHeight * scaleNumber;

            sheetName = sheetName + "_" + scaledWidth + "x" + scaledHeight;
            var startFrame = parseInt(w.startFrame.text);

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

            if (w.startfromtop.value == true) {
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
                        if (w.startfromtop.value == true) {
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

    function createSingleImage(onFinished) {
        try {
            w.hide();

            var duppedDoc = app.activeDocument.duplicate();
            app.activeDocument = duppedDoc;

            var layerGroups = duppedDoc.layerSets;
            var tmpName = sheetName;

            if (singleExportType == 0) {
                alert("This feature has not been implemented yet.");
                duppedDoc.close(SaveOptions.DONOTSAVECHANGES);
                app.activeDocument = currentDoc;
                return;
            } else if (singleExportType == 1) {
                for (var i = 0; i < layerGroups.length; i++) {

                    for (var j = 0; j < layerGroups.length; j++) {
                        layerGroups[j].visible = false;
                    }

                    layerGroups[i].visible = true;

                    sheetName = tmpName + "_" + layerGroups[i].name;

                    if (onFinished) {
                        onFinished(duppedDoc, currentDoc);
                    }
                }
            }

            sheetName = tmpName;
            duppedDoc.close(SaveOptions.DONOTSAVECHANGES);
            app.activeDocument = currentDoc;
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
        frames = parseInt(w.endFrame.text) - parseInt(w.startFrame.text) + 1;

        calculateColRowVals();

        w.rows.text = rows;
        w.columns.text = columns;
    }

    function saveAsPNG() {
        var finished = function (docu, originalDoc) {
            var exportedFile = null;

            if (sameFolder.value == true)
                exportedFile = new File(originalPath + "/" + sheetName + ".png");
            else
                exportedFile = File.saveDialog("Save as PNG", "*.png");

            if (exportedFile == null)
                return;

            var o = new ExportOptionsSaveForWeb();
            o.format = SaveDocumentType.PNG;
            o.PNG8 = smallbit.value;
            o.transparency = transparency.value;
            o.interlaced = false;
            o.includeProfile = false;
            o.quality = 100;

            docu.exportDocument(exportedFile, ExportType.SAVEFORWEB, o);

            if (tabIndex == 0) {
                docu.close(SaveOptions.DONOTSAVECHANGES);
                app.activeDocument = originalDoc;
            }
        }

        switch (tabIndex) {
            case 1:
                createSingleImage(finished);
                break;
            default:
                createSpriteSheet(finished);
                break;
        }
    }

    function exit() {
        w.close();
    }

    function createWindow() {
        w = new Window('dialog', 'Retro Sprite Generator', undefined, { closeButton: true });

        tabGroup = w.add('tabbedpanel');
        tabGroup.alignChildren = ['fill', 'fill'];
        tabGroup.onChange = function () {
            switch (tabGroup.selection.text) {
                case "Spritesheet Export":
                    tabIndex = 0;
                    break;
                default:
                    tabIndex = 1;
                    break;
            }
        }

        drawSpritesheetGUI(tabGroup);

        drawSingleImageGUI(tabGroup);

        // Options
        var optionsPanel = w.add('panel', undefined, "Export Options");
        optionsPanel.alignment = ['fill', 'top'];

        // Option Preferences
        var optionsGroup = optionsPanel.add('group');
        optionsGroup.alignment = ['left', 'top'];

        transparency = optionsGroup.add('checkbox', undefined, 'Transparency');
        transparency.value = true;

        smallbit = optionsGroup.add('checkbox', undefined, 'Smaller File (8-bit)');
        smallbit.value = false;

        // Action Buttons
        var buttons = w.add('group');
        buttons.cancel = buttons.add('button', undefined, 'Cancel');
        buttons.cancel.onClick = exit;

        buttons.saveAsPNGBtn = buttons.add('button', undefined, 'Save as PNG');
        buttons.saveAsPNGBtn.onClick = saveAsPNG;

        var sameFolderGroup = w.add('group');
        sameFolder = sameFolderGroup.add('Checkbox', undefined, 'Save in same folder');
        sameFolder.value = false;

        tabGroup.selection = tabIndex;

        w.show();
    }

    function drawSpritesheetGUI(tabGroup) {
        spriteTab = tabGroup.add('tab', undefined, 'Spritesheet Export');

        // Frames
        spriteTab.framePanel = spriteTab.add('panel', undefined, "Frames");
        spriteTab.framePanel.alignment = ['fill', 'top'];

        // Frame Preferences
        spriteTab.frameGroup = spriteTab.framePanel.add('group');
        spriteTab.frameGroup.alignment = ['left', 'top'];

        spriteTab.frameGroup.add('StaticText', [0, 0, 60, 25], 'Start frame:');
        spriteTab.startFrame = spriteTab.frameGroup.add('EditText', undefined, 1);
        spriteTab.startFrame.characters = 5;
        spriteTab.startFrame.onChange = onFramesChange;

        spriteTab.frameGroup.add('StaticText', [0, 0, 60, 25], 'End frame:');
        spriteTab.endFrame = spriteTab.frameGroup.add('EditText', undefined, frames);
        spriteTab.endFrame.characters = 5;
        spriteTab.endFrame.onChange = onFramesChange;

        // Sizes
        spriteTab.dimensionsPanel = spriteTab.add('panel', undefined, "Sizes");
        spriteTab.dimensionsPanel.alignment = ['fill', 'top'];

        // Size Preferences
        spriteTab.dimensionsGroup = spriteTab.dimensionsPanel.add('group');
        spriteTab.dimensionsGroup.alignment = ['left', 'top'];

        spriteTab.dimensionsGroup.add('StaticText', [0, 0, 60, 25], 'Columns:');
        spriteTab.columns = spriteTab.dimensionsGroup.add('EditText', undefined, columns);
        spriteTab.columns.characters = 5;
        spriteTab.columns.helpTip = 'Number of columns';

        spriteTab.dimensionsGroup.add('StaticText', [0, 0, 60, 25], 'Rows:');
        spriteTab.rows = spriteTab.dimensionsGroup.add('EditText', undefined, rows);
        spriteTab.rows.characters = 5;
        spriteTab.rows.helpTip = 'Number of rows';

        // Image Scale
        spriteTab.imageScalePanel = spriteTab.add('panel', undefined, "Image Scale");
        spriteTab.imageScalePanel.alignment = ['fill', 'top'];

        // Image Scale Preferences
        spriteTab.imageScaleGroup = spriteTab.imageScalePanel.add('group');
        spriteTab.imageScaleGroup.alignment = ['left', 'top'];

        spriteTab.imageScaleGroup.add('StaticText', [0, 0, 60, 25], 'Scale:');
        spriteTab.ddScaleNumber = spriteTab.imageScaleGroup.add("dropdownlist", undefined, ['Default', '@2x', '@3x']);

        spriteTab.ddScaleNumber.onChange = function () {
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
        spriteTab.imageScaleGroup.add('StaticText', undefined, 'Resample Method:');
        spriteTab.ddResampleMethod = spriteTab.imageScaleGroup.add("dropdownlist", undefined, ['Automatic', 'Bicubic', 'Bicubic Automatic', 'Bicubic Sharper', 'Bicubic Smoother', 'Bilinear', 'Nearest Neighbor', 'None', 'Preserve Details']);

        spriteTab.ddResampleMethod.onChange = function () {
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
        spriteTab.spacoffPanel = spriteTab.add('panel', undefined, "Spacing");
        spriteTab.spacoffPanel.alignment = ['fill', 'top'];

        // Spacing Preferences
        spriteTab.spacingGroup = spriteTab.spacoffPanel.add('group');
        spriteTab.spacingGroup.alignment = ['left', 'top'];

        spriteTab.spacingGroup.add('StaticText', [0, 0, 60, 25], 'Offset:');
        spriteTab.offset = spriteTab.spacingGroup.add('EditText', undefined, offset);
        spriteTab.offset.characters = 5;
        spriteTab.offset.helpTip = 'Outer space around sprite sheet';

        spriteTab.spacingGroup.add('StaticText', [0, 0, 60, 25], 'Padding:');
        spriteTab.padding = spriteTab.spacingGroup.add('EditText', undefined, padding);
        spriteTab.padding.characters = 5;
        spriteTab.padding.helpTip = 'Space between each images';

        // Start From
        spriteTab.startFromPanel = spriteTab.add('panel', undefined, "Start From");
        spriteTab.startFromPanel.alignment = ['fill', 'top'];

        // Option Preferences
        spriteTab.startFromGroup = spriteTab.startFromPanel.add('group');
        spriteTab.startFromGroup.alignment = ['left', 'top'];

        spriteTab.startfromtop = spriteTab.startFromGroup.add('radiobutton', undefined, 'Top');
        spriteTab.startfromtop.value = true;
        spriteTab.startfrombottom = spriteTab.startFromGroup.add('radiobutton', undefined, 'Bottom');
        spriteTab.startfrombottom.value = false;

        spriteTab.ddScaleNumber.items[selectedScale].selected = true;
        spriteTab.ddResampleMethod.items[selectedResample].selected = true;
    }

    function drawSingleImageGUI(tabGroup) {
        singleTab = tabGroup.add('tab', undefined, 'Single Export');

        // Image Scale
        singleTab.exportTypePanel = singleTab.add('panel', undefined, "Export Mode");
        singleTab.exportTypePanel.alignment = ['fill', 'top'];

        // Image Scale Preferences
        singleTab.exportTypeGroup = singleTab.exportTypePanel.add('group');
        singleTab.exportTypeGroup.alignment = ['left', 'top'];

        singleTab.exportTypeGroup.add('StaticText', [0, 0, 60, 25], 'Export:');
        singleTab.ddTypeIndex = singleTab.exportTypeGroup.add("dropdownlist", undefined, ['Layers', 'Groups']);

        singleTab.ddTypeIndex.onChange = function () {
            singleExportType = this.selection.index;
        }

        singleTab.ddTypeIndex.items[singleExportType].selected = true;
    }
}
