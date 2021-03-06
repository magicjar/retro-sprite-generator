/**
 * Title: Retro Sprite Generator
 * Author: @magicjar
 * Url: https://github.com/magicjar
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
// Functions
///////////////////////////////////////////////////////////////////////////////

var w,
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
// Dispatch
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


///////////////////////////////////////////////////////////////////////////////
// Function: createSpriteSheet
// Usage: sprite-sheet document builder
// Input: export options
// Return: <none>, a file on disk
///////////////////////////////////////////////////////////////////////////////

function createSpriteSheet(onFinished) {
    try {
        if (frames == 0) {
            alert("No animation frames were found.\nThis script requires minimum of 1 frame animation to create a sprite sheet.");
            return;
        }

        var savedPrefs = {
            typeUnits: app.preferences.typeUnits,
            rulerUnits: app.preferences.rulerUnits
        };

        app.preferences.typeUnits = TypeUnits.PIXELS;
        app.preferences.rulerUnits = Units.PIXELS;

        w.hide();

        // Parse forms
        columns = parseInt(w.tabGroup.spriteTab.columns.text);
        rows = parseInt(w.tabGroup.spriteTab.rows.text);
        padding = parseInt(w.tabGroup.spriteTab.padding.text);
        offset = parseInt(w.tabGroup.spriteTab.offset.text);
        var startFrame = parseInt(w.tabGroup.spriteTab.startFrame.text);

        // Scaled width and height variable
        var scaledWidth = spriteWidth * scaleNumber;
        var scaledHeight = spriteHeight * scaleNumber;

        // Create namming
        sheetName = sheetName + "_" + parseInt(scaledWidth) + "x" + parseInt(scaledHeight);

        // Duplicate original Document
        var duppedDoc = app.activeDocument.duplicate();
        // Resize and Resample duplicated Document if scaling is true
        if (scaleNumber > 1) {
            duppedDoc.resizeImage(scaledWidth, scaledHeight, spriteResolution, resampleMethod, sheetName + "_dupped");
        }

        // Create temporary Document
        var tempDoc = app.documents.add(scaledWidth, scaledHeight, spriteResolution, sheetName + "_tmp");

        // Create sprite sheet Document
        var spriteSheetDoc = app.documents.add((scaledWidth * columns) + (padding * (columns - 1)), (scaledHeight * rows) + (padding * (rows - 1)), spriteResolution, sheetName + "_spritesheet");

        var cellSize = getSelectionShape(scaledWidth, 0, scaledHeight, 0);

        if (w.tabGroup.spriteTab.startFromTop.value == true) {
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
                    if (w.tabGroup.spriteTab.startFromTop.value == true) {
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

            if (onFinished) {
                onFinished(spriteSheetDoc, currentDoc);
            }

            app.preferences.typeUnits = savedPrefs.typeUnits;
            app.preferences.rulerUnits = savedPrefs.rulerUnits;
        }
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
    frames = parseInt(w.tabGroup.spriteTab.endFrame.text) - parseInt(w.tabGroup.spriteTab.startFrame.text) + 1;

    calculateColRowVals();

    w.tabGroup.spriteTab.row.text = rows;
    w.tabGroup.spriteTab.columns.text = columns;
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
        o.PNG8 = w.optionsPanel.optionsGroup.smallbit.value;
        o.transparency = w.optionsPanel.optionsGroup.transparency.value;
        o.interlaced = w.optionsPanel.optionsGroup.transparency.value;
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

    exit();
}

function exit() {
    w.close();
}

function createWindow() {
    w = new Window('dialog', 'Retro Sprite Generator', undefined, { closeButton: true });

    w.tabGroup = w.add('tabbedpanel');
    w.tabGroup.alignChildren = 'fill';

    w.tabGroup.onChange = function () {
        switch (w.tabGroup.selection.text) {
            case "Spritesheet Export":
                tabIndex = 0;
                break;
            default:
                tabIndex = 1;
                break;
        }
    }

    drawSpritesheetGUI();

    drawSingleImageGUI();

    // Options
    w.optionsPanel = w.add('panel', undefined, "Export Options");
    w.optionsPanel.alignment = ['fill', 'fill'];

    // Option Preferences
    w.optionsPanel.optionsGroup = w.optionsPanel.add('group');
    w.optionsPanel.optionsGroup.alignment = ['left', 'top'];

    w.optionsPanel.optionsGroup.interlaced = w.optionsPanel.optionsGroup.add('checkbox', undefined, 'Interlaced');
    w.optionsPanel.optionsGroup.interlaced.value = false;

    w.optionsPanel.optionsGroup.transparency = w.optionsPanel.optionsGroup.add('checkbox', undefined, 'Transparency');
    w.optionsPanel.optionsGroup.transparency.value = true;

    w.optionsPanel.optionsGroup.smallbit = w.optionsPanel.optionsGroup.add('checkbox', undefined, 'Smaller File (8-bit)');
    w.optionsPanel.optionsGroup.smallbit.value = false;

    // Action Buttons
    var buttons = w.add('group');
    buttons.cancel = buttons.add('button', undefined, 'Cancel');
    buttons.cancel.onClick = exit;

    buttons.saveAsPNGBtn = buttons.add('button', undefined, 'Save as PNG');
    buttons.saveAsPNGBtn.onClick = saveAsPNG;

    var sameFolderGroup = w.add('group');
    sameFolder = sameFolderGroup.add('Checkbox', undefined, 'Save in same folder');
    sameFolder.value = false;

    w.tabGroup.selection = tabIndex;

    w.show();
}

function drawSpritesheetGUI() {
    w.tabGroup.spriteTab = w.tabGroup.add('tab', undefined, 'Spritesheet Export');

    // Frames
    w.tabGroup.spriteTab.framePanel = w.tabGroup.spriteTab.add('panel', undefined, "Frames");
    w.tabGroup.spriteTab.framePanel.alignChildren = 'fill';
    w.tabGroup.spriteTab.framePanel.alignment = 'fill';

    // Frame Preferences
    w.tabGroup.spriteTab.frameGroup = w.tabGroup.spriteTab.framePanel.add('group');
    w.tabGroup.spriteTab.frameGroup.alignChildren = ['fill', 'fill'];
    w.tabGroup.spriteTab.frameGroup.alignment = ['fill', 'top'];

    w.tabGroup.spriteTab.frameGroup.add('StaticText', [0, 0, 60, 25], 'Start frame:');
    w.tabGroup.spriteTab.startFrame = w.tabGroup.spriteTab.frameGroup.add('EditText', undefined, 1);
    w.tabGroup.spriteTab.startFrame.characters = 5;
    w.tabGroup.spriteTab.startFrame.onChange = onFramesChange;

    w.tabGroup.spriteTab.frameGroup.add('StaticText', [0, 0, 60, 25], 'End frame:');
    w.tabGroup.spriteTab.endFrame = w.tabGroup.spriteTab.frameGroup.add('EditText', undefined, frames);
    w.tabGroup.spriteTab.endFrame.characters = 5;
    w.tabGroup.spriteTab.endFrame.onChange = onFramesChange;

    // Sizes
    w.tabGroup.spriteTab.dimensionsPanel = w.tabGroup.spriteTab.add('panel', undefined, "Sizes");
    w.tabGroup.spriteTab.dimensionsPanel.alignChildren = 'fill';
    w.tabGroup.spriteTab.dimensionsPanel.alignment = 'fill';

    // Size Preferences
    w.tabGroup.spriteTab.dimensionsGroup = w.tabGroup.spriteTab.dimensionsPanel.add('group');
    w.tabGroup.spriteTab.dimensionsGroup.alignChildren = ['fill', 'fill'];
    w.tabGroup.spriteTab.dimensionsGroup.alignment = ['fill', 'top'];

    w.tabGroup.spriteTab.dimensionsGroup.add('StaticText', [0, 0, 60, 25], 'Columns:');
    w.tabGroup.spriteTab.columns = w.tabGroup.spriteTab.dimensionsGroup.add('EditText', undefined, columns);
    w.tabGroup.spriteTab.columns.characters = 5;
    w.tabGroup.spriteTab.columns.helpTip = 'Number of columns';

    w.tabGroup.spriteTab.dimensionsGroup.add('StaticText', [0, 0, 60, 25], 'Rows:');
    w.tabGroup.spriteTab.rows = w.tabGroup.spriteTab.dimensionsGroup.add('EditText', undefined, rows);
    w.tabGroup.spriteTab.rows.characters = 5;
    w.tabGroup.spriteTab.rows.helpTip = 'Number of rows';

    // Image Scale
    w.tabGroup.spriteTab.imageScalePanel = w.tabGroup.spriteTab.add('panel', undefined, "Image Scale");
    w.tabGroup.spriteTab.imageScalePanel.alignChildren = 'fill';
    w.tabGroup.spriteTab.imageScalePanel.alignment = 'fill';

    // Image Scale Preferences
    w.tabGroup.spriteTab.imageScaleGroup = w.tabGroup.spriteTab.imageScalePanel.add('group');
    w.tabGroup.spriteTab.imageScaleGroup.alignChildren = ['fill', 'fill'];
    w.tabGroup.spriteTab.imageScaleGroup.alignment = ['fill', 'top'];

    w.tabGroup.spriteTab.imageScaleGroup.add('StaticText', [0, 0, 60, 25], 'Scale:');
    w.tabGroup.spriteTab.ddScaleNumber = w.tabGroup.spriteTab.imageScaleGroup.add("dropdownlist", undefined, ['Default', '@2x', '@3x']);

    w.tabGroup.spriteTab.ddScaleNumber.onChange = function () {
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
    w.tabGroup.spriteTab.imageScaleGroup.add('StaticText', undefined, 'Resample Method:');
    w.tabGroup.spriteTab.ddResampleMethod = w.tabGroup.spriteTab.imageScaleGroup.add("dropdownlist", undefined, ['Automatic', 'Bicubic', 'Bicubic Automatic', 'Bicubic Sharper', 'Bicubic Smoother', 'Bilinear', 'Nearest Neighbor', 'None', 'Preserve Details']);

    w.tabGroup.spriteTab.ddResampleMethod.onChange = function () {
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
    w.tabGroup.spriteTab.spacoffPanel = w.tabGroup.spriteTab.add('panel', undefined, "Spacing");
    w.tabGroup.spriteTab.spacoffPanel.alignChildren = 'fill';
    w.tabGroup.spriteTab.spacoffPanel.alignment = 'fill';

    // Spacing Preferences
    w.tabGroup.spriteTab.spacingGroup = w.tabGroup.spriteTab.spacoffPanel.add('group');
    w.tabGroup.spriteTab.spacingGroup.alignChildren = ['fill', 'fill'];
    w.tabGroup.spriteTab.spacingGroup.alignment = ['fill', 'top'];

    w.tabGroup.spriteTab.spacingGroup.add('StaticText', [0, 0, 60, 25], 'Offset:');
    w.tabGroup.spriteTab.offset = w.tabGroup.spriteTab.spacingGroup.add('EditText', undefined, offset);
    w.tabGroup.spriteTab.offset.characters = 5;
    w.tabGroup.spriteTab.offset.helpTip = 'Outer space around sprite sheet';

    w.tabGroup.spriteTab.spacingGroup.add('StaticText', [0, 0, 60, 25], 'Padding:');
    w.tabGroup.spriteTab.padding = w.tabGroup.spriteTab.spacingGroup.add('EditText', undefined, padding);
    w.tabGroup.spriteTab.padding.characters = 5;
    w.tabGroup.spriteTab.padding.helpTip = 'Space between each images';

    // Start From
    w.tabGroup.spriteTab.startFromPanel = w.tabGroup.spriteTab.add('panel', undefined, "Start From");
    w.tabGroup.spriteTab.startFromPanel.alignChildren = 'fill';
    w.tabGroup.spriteTab.startFromPanel.alignment = 'fill';

    // Option Preferences
    w.tabGroup.spriteTab.startFromGroup = w.tabGroup.spriteTab.startFromPanel.add('group');
    w.tabGroup.spriteTab.startFromGroup.alignChildren = ['fill', 'fill'];
    w.tabGroup.spriteTab.startFromGroup.alignment = ['fill', 'top'];

    w.tabGroup.spriteTab.startFromTop = w.tabGroup.spriteTab.startFromGroup.add('radiobutton', undefined, 'Top');
    w.tabGroup.spriteTab.startFromTop.value = true;
    w.tabGroup.spriteTab.startFromBottom = w.tabGroup.spriteTab.startFromGroup.add('radiobutton', undefined, 'Bottom');
    w.tabGroup.spriteTab.startFromBottom.value = false;

    w.tabGroup.spriteTab.ddScaleNumber.items[selectedScale].selected = true;
    w.tabGroup.spriteTab.ddResampleMethod.items[selectedResample].selected = true;
}

function drawSingleImageGUI() {
    w.tabGroup.singleTab = w.tabGroup.add('tab', undefined, 'Single Export');

    // Image Scale
    w.tabGroup.singleTab.exportTypePanel = w.tabGroup.singleTab.add('panel', undefined, "Export Mode");
    w.tabGroup.singleTab.exportTypePanel.alignChildren = 'fill';
    w.tabGroup.singleTab.exportTypePanel.alignment = 'fill';

    // Image Scale Preferences
    w.tabGroup.singleTab.exportTypeGroup = w.tabGroup.singleTab.exportTypePanel.add('group');
    w.tabGroup.singleTab.exportTypeGroup.alignChildren = ['fill', 'fill'];
    w.tabGroup.singleTab.exportTypeGroup.alignment = ['fill', 'top'];

    w.tabGroup.singleTab.exportTypeGroup.add('StaticText', [0, 0, 60, 25], 'Export:');
    w.tabGroup.singleTab.ddTypeIndex = w.tabGroup.singleTab.exportTypeGroup.add("dropdownlist", undefined, ['Layers', 'Groups']);

    w.tabGroup.singleTab.ddTypeIndex.onChange = function () {
        singleExportType = this.selection.index;
    }

    w.tabGroup.singleTab.ddTypeIndex.items[singleExportType].selected = true;
}
