/**
 * Title: Retro Sprite Generator
 * Author: @magicjar
 * Url: https://github.com/magicjar
*/

/*
@@@BUILDINFO@@@ Retro Sprite Generator.jsx 2.0.0
*/

/*
// BEGIN__HARVEST_EXCEPTION_ZSTRING

<javascriptresource>
    <name>$$$/JavaScripts/RetroSpriteGenerator/Menu=Retro Sprite Generator...</name>
    <category>scriptexport</category>
    <menu>export</menu>
    <enableinfo>true</enableinfo>
    <eventid>c1448398-d731-4691-9c60-2f5410fc703a</eventid>
</javascriptresource>

// END__HARVEST_EXCEPTION_ZSTRING
*/


#target photoshop


///////////////////////////////////////////////////////////////////////////////
// Globals
///////////////////////////////////////////////////////////////////////////////

var w,
    tabIndex = 0,
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
    singleExportType = 0;

var jpegIndex = 0;
var pngIndex = 1;

var exportButtonID = 1;
var cancelButtonID = 2;


///////////////////////////////////////////////////////////////////////////////
// Dispatch
///////////////////////////////////////////////////////////////////////////////

init();

function init() {
    if (frames == 0) {
        tabIndex = 1;
    }

    var exportOptions = new Object();
    initExportOptions(exportOptions);

    // Get last used params via Photoshop registry
    try {
        var d = app.getCustomOptions("f987ff71-e289-49e3-9a5f-f35b106321e1");
        descriptorToObject(exportOptions, d, "Retro Sprite Generator settings");
    } catch (e) {

    }

    descriptorToObject(exportOptions, app.playbackParameters, "Retro Sprite Generator settings");

    currentDoc = app.activeDocument;
    sheetName = originalDocName = currentDoc.name.split('.')[0];
    spriteWidth = currentDoc.width;
    spriteHeight = currentDoc.height;
    spriteResolution = currentDoc.resolution;
    calculateColRowVals();

    if (DialogModes.ALL == app.playbackDisplayDialogs) {
        if (cancelButtonID == createWindow(exportOptions)) {
            return 'cancel';
        }
    }

    switch (tabIndex) {
        case 1:
            createSingleImage(exportOptions);
            break;
        default:
            createSpriteSheet(exportOptions);
            break;
    }

    var d = objectToDescriptor(exportOptions, "Retro Sprite Generator settings");
    app.putCustomOptions("f987ff71-e289-49e3-9a5f-f35b106321e1", d);

    var dd = objectToDescriptor(exportOptions, "Retro Sprite Generator settings");
    app.playbackParameters = dd;
}


///////////////////////////////////////////////////////////////////////////////
// Function: createSingleImage
// Usage: single file document builder
// Input: export options
// Return: <none>, a file on disk
///////////////////////////////////////////////////////////////////////////////
function createSingleImage(exportOptions) {
    try {
        var duppedDoc = app.activeDocument.duplicate();
        app.activeDocument = duppedDoc;

        if (singleExportType == 1)
            exportGroupRecursively(exportOptions, duppedDoc, currentDoc, duppedDoc);
        else
            exportLayerRecursively(exportOptions, duppedDoc, currentDoc, duppedDoc);

        duppedDoc.close(SaveOptions.DONOTSAVECHANGES);
        app.activeDocument = currentDoc;
    } catch (ex) {
        alert("An error occured, please submit a bug report. Error: " + ex);
    }
}


///////////////////////////////////////////////////////////////////////////////
// Function: createSpriteSheet
// Usage: sprite-sheet document builder
// Input: export options
// Return: <none>, a file on disk
///////////////////////////////////////////////////////////////////////////////
function createSpriteSheet(exportOptions) {
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
        var sheetName = exportOptions.fileNamePrefix + "_" + parseInt(scaledWidth) + "x" + parseInt(scaledHeight);

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

            exportOptions.pngInterlaced = w.tabGroup.spriteTab.optionsPanel.optionsGroup.interlaced.value;
            exportOptions.pngTransparency = w.tabGroup.spriteTab.optionsPanel.optionsGroup.transparency.value;
            exportOptions.png8 = w.tabGroup.spriteTab.optionsPanel.optionsGroup.smallbit.value;

            saveFile(spriteSheetDoc, sheetName, exportOptions);

            app.preferences.typeUnits = savedPrefs.typeUnits;
            app.preferences.rulerUnits = savedPrefs.rulerUnits;
        }

        spriteSheetDoc.close(SaveOptions.DONOTSAVECHANGES);
        app.activeDocument = currentDoc;
    } catch (ex) {
        alert("An error occured, please submit a bug report. Error: " + ex);
    }
}


function exportLayerRecursively(exportOptions, dupObj, oriObj, dupDocRef) {
    setInvisibleAllArtLayers(dupObj);

    for (var k = 0; k < dupObj.artLayers.length; k++) {
        if (exportOptions.visibleOnly)
            if (!oriObj.artLayers[k].visible)
                continue;

        dupObj.artLayers[k].visible = true;

        var tmpName = exportOptions.fileNamePrefix + "_" + dupObj.artLayers[k].name;

        var duppedDocumentTmp = dupDocRef.duplicate();

        if (exportOptions.fileType != pngIndex)
            duppedDocumentTmp.flatten();

        saveFile(duppedDocumentTmp, tmpName, exportOptions);

        duppedDocumentTmp.close(SaveOptions.DONOTSAVECHANGES);

        dupObj.artLayers[k].visible = false;
    }

    // Recursive
    for (var i = 0; i < dupObj.layerSets.length; i++) {
        if (exportOptions.visibleOnly)
            if (!oriObj.layerSets[i].visible)
                continue;

        exportLayerRecursively(exportOptions, dupObj.layerSets[i], oriObj.layerSets[i], dupDocRef); // recursive
    }
}

function exportGroupRecursively(exportOptions, dupObj, oriObj, dupDocRef) {
    setInvisibleAllLayerSets(dupObj, false);

    for (var i = 0; i < dupObj.layerSets.length; i++) {
        if (exportOptions.visibleOnly)
            if (!oriObj.layerSets[i].visible)
                continue;

        dupObj.layerSets[i].visible = true;

        var tmpName = exportOptions.fileNamePrefix + "_" + dupObj.layerSets[i].name;

        var duppedDocumentTmp = dupDocRef.duplicate();

        if (exportOptions.fileType != pngIndex)
            duppedDocumentTmp.flatten();

        saveFile(duppedDocumentTmp, tmpName, exportOptions);

        duppedDocumentTmp.close(SaveOptions.DONOTSAVECHANGES);

        dupObj.layerSets[i].visible = false;
    }

    // Recursive
    // for (var i = 0; i < dupObj.layerSets.length; i++) {
    //     // if (visibleOnly) {
    //     //     if (!oriObj.layerSets[i].visible) {
    //     //         continue;

    //     exportGroupRecursively(exportOptions, dupObj, oriObj, fileName);
    // }
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


///////////////////////////////////////////////////////////////////////////////
// Copyright 2007.  Adobe Systems, Incorporated.  All rights reserved.
// Function: setInvisibleAllArtLayers
// Usage: unlock and make invisible all art layers, recursively
// Input: document or layerset
// Return: all art layers are unlocked and invisible
///////////////////////////////////////////////////////////////////////////////
function setInvisibleAllArtLayers(obj) {
    for (var i = 0; i < obj.artLayers.length; i++) {
        obj.artLayers[i].allLocked = false;
        obj.artLayers[i].visible = false;
    }

    for (var i = 0; i < obj.layerSets.length; i++) {
        setInvisibleAllArtLayers(obj.layerSets[i]);
    }
}

///////////////////////////////////////////////////////////////////////////////
// Function: setInvisibleAllLayerSets
// Usage: unlock and make invisible all layer sets (layer group)
// Input: document or layerset and is recursive
// Return: all art layers are unlocked and invisible
///////////////////////////////////////////////////////////////////////////////
function setInvisibleAllLayerSets(obj, recursively) {
    for (var i = 0; i < obj.layerSets.length; i++) {
        obj.layerSets[i].visible = false;
    }

    if (!recursively)
        return;

    for (var i = 0; i < obj.layerSets.length; i++) {
        setInvisibleAllLayerSets(obj.layerSets[i]);
    }
}


///////////////////////////////////////////////////////////////////////////////
// Function: removeAllInvisibleArtLayers
// Usage: remove all the invisible art layers, recursively
// Input: document or layer set
// Return: <none>, all layers that were invisible are now gone
///////////////////////////////////////////////////////////////////////////////
function removeAllInvisibleArtLayers(obj) {
    for (var i = obj.artLayers.length - 1; 0 <= i; i--)
        if (!obj.artLayers[i].visible)
            obj.artLayers[i].remove();

    for (var i = obj.layerSets.length - 1; 0 <= i; i--)
        removeAllInvisibleArtLayers(obj.layerSets[i]);
}


///////////////////////////////////////////////////////////////////////////////
// Function: removeAllEmptyLayerSets
// Usage: find all empty layer sets and remove them, recursively
// Input: document or layer set
// Return: empty layer sets are now gone
///////////////////////////////////////////////////////////////////////////////
function removeAllEmptyLayerSets(obj) {
    var foundEmpty = true;

    for (var i = obj.layerSets.length - 1; 0 <= i; i--) {
        if (removeAllEmptyLayerSets(obj.layerSets[i]))
            obj.layerSets[i].remove();
        else
            foundEmpty = false;
    }
    if (obj.artLayers.length > 0)
        foundEmpty = false;

    return foundEmpty;
}


///////////////////////////////////////////////////////////////////////////////
// Function: zeroSuppress
// Usage: return a string padded to digit(s)
// Input: num to convert, digit count needed
// Return: string padded to digit length
///////////////////////////////////////////////////////////////////////////////
function removeAllInvisible(docRef) {
    removeAllInvisibleArtLayers(docRef);
    removeAllEmptyLayerSets(docRef);
}


function exit() {
    w.close();
}


///////////////////////////////////////////////////////////////////////////////
// Function: saveFile
// Usage: the worker routine, take our params and save the file accordingly
// Input: reference to the document, the name of the output file, 
//        export info object containing more information
// Return: <none>, a file on disk
///////////////////////////////////////////////////////////////////////////////
function saveFile(docRef, fileNameBody, exportOptions) {
    switch (exportOptions.fileType) {
        case jpegIndex:
            var jpgSaveOptions = new JPEGSaveOptions();
            var saveFile = new File(exportOptions.destination + "/" + fileNameBody + ".jpg");
            jpgSaveOptions.embedColorProfile = exportOptions.icc;
            jpgSaveOptions.quality = exportOptions.jpegQuality;
            docRef.saveAs(saveFile, jpgSaveOptions, true, Extension.LOWERCASE);
            break;
        case pngIndex:
            var pngS4WOptions = new ExportOptionsSaveForWeb();
            var saveFile = new File(exportOptions.destination + "/" + fileNameBody + ".png");
            pngS4WOptions.format = SaveDocumentType.PNG;
            pngS4WOptions.PNG8 = exportOptions.png8;
            pngS4WOptions.transparency = exportOptions.pngTransparency;
            pngS4WOptions.interlaced = exportOptions.pngInterlaced;
            pngS4WOptions.includeProfile = exportOptions.icc;
            pngS4WOptions.quality = 100;
            docRef.exportDocument(saveFile, ExportType.SAVEFORWEB, pngS4WOptions);
            break;
        default:
            if (DialogModes.NO != app.playbackDisplayDialogs) {
                alert("Unexpected error");
            }
            break;
    }
}


///////////////////////////////////////////////////////////////////////////////
// Function: createWindow
// Usage: pop the ui and get user settings
// Input: exportOptions object containing our parameters
// Return: on ok, the dialog info is set to the exportOptions object
///////////////////////////////////////////////////////////////////////////////
function createWindow(exportOptions) {
    w = new Window('dialog', 'Retro Sprite Generator', undefined, { closeButton: true });

    w.tabGroup = w.add('tabbedpanel');
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

    drawSpritesheetGUI(exportOptions);
    drawSingleImageGUI(exportOptions);

    // Destination
    w.destinationPanel = w.add('panel', undefined, "Export Destination");

    // Destination Preferences
    w.destinationPanel.destinationGroup = w.destinationPanel.add("group");

    w.destinationPanel.destinationGroup.destinationForm = w.destinationPanel.destinationGroup.add("edittext", [0, 0, 365, 20], exportOptions.destination.toString());

    w.destinationPanel.destinationGroup.destinationBrowse = w.destinationPanel.destinationGroup.add("button", [0, 0, 100, 20], "Browse");
    w.destinationPanel.destinationGroup.destinationBrowse.onClick = function () {
        var defaultFolder = w.destinationPanel.destinationGroup.destinationForm.text;
        var testFolder = new Folder(w.destinationPanel.destinationGroup.destinationForm.text);
        if (!testFolder.exists) {
            defaultFolder = "~";
        }
        var selFolder = Folder.selectDialog("Select Destination", defaultFolder);
        if (selFolder != null) {
            w.destinationPanel.destinationGroup.destinationForm.text = selFolder.fsName;
        }
        w.defaultElement.active = true;
    }

    // Filename
    w.namePanel = w.add('panel', undefined, "File Name Prefix");

    // Filename Preferences
    w.namePanel.nameGroup = w.namePanel.add('group');

    w.namePanel.nameGroup.nameText = w.namePanel.nameGroup.add("edittext", [0, 0, 475, 20], exportOptions.fileNamePrefix.toString());

    // Action Buttons
    var buttons = w.add('group');
    buttons.cancel = buttons.add('button', undefined, 'Cancel');
    buttons.cancel.onClick = function () {
        w.close(cancelButtonID);
    };

    buttons.export = buttons.add('button', undefined, 'Export');
    buttons.export.onClick = function () {
        var destination = w.destinationPanel.destinationGroup.destinationForm.text;
        if (destination.length == 0) {
            alert('Please specify destination.');
            return;
        }
        var testFolder = new Folder(destination);
        if (!testFolder.exists) {
            alert('Destination does not exist.');
            return;
        }
        w.close(exportButtonID);
    };

    w.tabGroup.selection = tabIndex;

    var result = w.show();

    if (cancelButtonID == result)
        return result;

    exportOptions.destination = w.destinationPanel.destinationGroup.destinationForm.text;
    exportOptions.fileNamePrefix = w.namePanel.nameGroup.nameText.text;
    exportOptions.visibleOnly = w.tabGroup.singleTab.optionsPanel.pngOptionGroup.visibleOnly.value;
    exportOptions.fileType = w.tabGroup.singleTab.exportTypePanel.exportTypeGroup.ddFileType.selection.index;
    if (exportOptions.fileType == jpegIndex)
        exportOptions.icc = w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.icc.value;
    else
        exportOptions.icc = w.tabGroup.singleTab.optionsPanel.pngOptionGroup.icc.value;
    exportOptions.pngTransparency = w.tabGroup.singleTab.optionsPanel.pngOptionGroup.pngTransparency.value;
    exportOptions.pngInterlaced = w.tabGroup.singleTab.optionsPanel.pngOptionGroup.pngInterlaced.value;
    exportOptions.pngTrim = w.tabGroup.singleTab.optionsPanel.pngOptionGroup.pngTrim.value;
    exportOptions.png8 = w.tabGroup.singleTab.optionsPanel.pngOptionGroup.png8.value;
    exportOptions.jpegQuality = w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.jpegQualityGroup.jpegQualityText.text;

    return result;
}

function drawSpritesheetGUI(exportOptions) {
    w.tabGroup.spriteTab = w.tabGroup.add('tab', undefined, 'Spritesheet Export');

    // Frames
    w.tabGroup.spriteTab.framePanel = w.tabGroup.spriteTab.add('panel', undefined, "Frames");

    // Frame Preferences
    w.tabGroup.spriteTab.frameGroup = w.tabGroup.spriteTab.framePanel.add('group');

    w.tabGroup.spriteTab.frameGroup.add('StaticText', [0, 0, 70, 20], 'Start frame:');
    w.tabGroup.spriteTab.startFrame = w.tabGroup.spriteTab.frameGroup.add('EditText', [0, 0, 120, 20], 1);
    w.tabGroup.spriteTab.startFrame.onChange = onFramesChange;

    w.tabGroup.spriteTab.frameGroup.add('StaticText', [0, 0, 70, 20], 'End frame:');
    w.tabGroup.spriteTab.endFrame = w.tabGroup.spriteTab.frameGroup.add('EditText', [0, 0, 120, 20], frames);
    w.tabGroup.spriteTab.endFrame.onChange = onFramesChange;

    // Sizes
    w.tabGroup.spriteTab.dimensionsPanel = w.tabGroup.spriteTab.add('panel', undefined, "Sizes");

    // Size Preferences
    w.tabGroup.spriteTab.dimensionsGroup = w.tabGroup.spriteTab.dimensionsPanel.add('group');

    w.tabGroup.spriteTab.dimensionsGroup.add('StaticText', [0, 0, 70, 20], 'Columns:');
    w.tabGroup.spriteTab.columns = w.tabGroup.spriteTab.dimensionsGroup.add('EditText', [0, 0, 120, 20], columns);
    w.tabGroup.spriteTab.columns.helpTip = 'Number of columns';

    w.tabGroup.spriteTab.dimensionsGroup.add('StaticText', [0, 0, 70, 20], 'Rows:');
    w.tabGroup.spriteTab.rows = w.tabGroup.spriteTab.dimensionsGroup.add('EditText', [0, 0, 120, 20], rows);
    w.tabGroup.spriteTab.rows.helpTip = 'Number of rows';

    // Image Scale
    w.tabGroup.spriteTab.imageScalePanel = w.tabGroup.spriteTab.add('panel', undefined, "Image Scale");

    // Image Scale Preferences
    w.tabGroup.spriteTab.imageScaleGroup = w.tabGroup.spriteTab.imageScalePanel.add('group');

    w.tabGroup.spriteTab.imageScaleGroup.add('StaticText', [0, 0, 70, 20], 'Scale:');
    w.tabGroup.spriteTab.ddScaleNumber = w.tabGroup.spriteTab.imageScaleGroup.add("dropdownlist", [0, 0, 120, 20], ['Default', '@2x', '@3x']);

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
    w.tabGroup.spriteTab.imageScaleGroup.add('StaticText', [0, 0, 70, 20], 'Resample:');
    w.tabGroup.spriteTab.ddResampleMethod = w.tabGroup.spriteTab.imageScaleGroup.add("dropdownlist", [0, 0, 120, 20], ['Automatic', 'Bicubic', 'Bicubic Automatic', 'Bicubic Sharper', 'Bicubic Smoother', 'Bilinear', 'Nearest Neighbor', 'None', 'Preserve Details']);

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

    // Spacing Preferences
    w.tabGroup.spriteTab.spacingGroup = w.tabGroup.spriteTab.spacoffPanel.add('group');

    w.tabGroup.spriteTab.spacingGroup.add('StaticText', [0, 0, 70, 20], 'Offset:');
    w.tabGroup.spriteTab.offset = w.tabGroup.spriteTab.spacingGroup.add('EditText', [0, 0, 120, 20], offset);
    w.tabGroup.spriteTab.offset.helpTip = 'Outer space around sprite sheet';

    w.tabGroup.spriteTab.spacingGroup.add('StaticText', [0, 0, 70, 20], 'Padding:');
    w.tabGroup.spriteTab.padding = w.tabGroup.spriteTab.spacingGroup.add('EditText', [0, 0, 120, 20], padding);
    w.tabGroup.spriteTab.padding.helpTip = 'Space between each images';

    // Start From
    w.tabGroup.spriteTab.startFromPanel = w.tabGroup.spriteTab.add('panel', undefined, "Start From");

    // Option Preferences
    w.tabGroup.spriteTab.startFromGroup = w.tabGroup.spriteTab.startFromPanel.add('group');

    w.tabGroup.spriteTab.startFromTop = w.tabGroup.spriteTab.startFromGroup.add('radiobutton', [0, 0, 200, 20], 'Top');
    w.tabGroup.spriteTab.startFromTop.value = true;
    w.tabGroup.spriteTab.startFromBottom = w.tabGroup.spriteTab.startFromGroup.add('radiobutton', [0, 0, 200, 20], 'Bottom');
    w.tabGroup.spriteTab.startFromBottom.value = false;

    w.tabGroup.spriteTab.ddScaleNumber.items[selectedScale].selected = true;
    w.tabGroup.spriteTab.ddResampleMethod.items[selectedResample].selected = true;

    // Options
    w.tabGroup.spriteTab.optionsPanel = w.tabGroup.spriteTab.add('panel', undefined, "Export Options");
    w.tabGroup.spriteTab.optionsPanel.alignment = ['fill', 'fill'];

    // Option Preferences
    w.tabGroup.spriteTab.optionsPanel.optionsGroup = w.tabGroup.spriteTab.optionsPanel.add('group');

    w.tabGroup.spriteTab.optionsPanel.optionsGroup.interlaced = w.tabGroup.spriteTab.optionsPanel.optionsGroup.add('checkbox', undefined, 'Interlaced');
    w.tabGroup.spriteTab.optionsPanel.optionsGroup.interlaced.value = exportOptions.pngInterlaced;

    w.tabGroup.spriteTab.optionsPanel.optionsGroup.transparency = w.tabGroup.spriteTab.optionsPanel.optionsGroup.add('checkbox', undefined, 'Transparency');
    w.tabGroup.spriteTab.optionsPanel.optionsGroup.transparency.value = exportOptions.pngTransparency;

    w.tabGroup.spriteTab.optionsPanel.optionsGroup.smallbit = w.tabGroup.spriteTab.optionsPanel.optionsGroup.add('checkbox', undefined, 'Smaller File (8-bit)');
    w.tabGroup.spriteTab.optionsPanel.optionsGroup.smallbit.value = exportOptions.png8;
}

function drawSingleImageGUI(exportOptions) {
    w.tabGroup.singleTab = w.tabGroup.add('tab', undefined, 'Single Export');

    // Export Mode
    w.tabGroup.singleTab.exportModePanel = w.tabGroup.singleTab.add('panel', undefined, "Export Mode");

    // Export Mode Preferences
    w.tabGroup.singleTab.exportModePanel.exportModeGroup = w.tabGroup.singleTab.exportModePanel.add('group');

    w.tabGroup.singleTab.exportModePanel.exportModeGroup.add('StaticText', [0, 0, 70, 20], 'Export:');
    w.tabGroup.singleTab.ddTypeIndex = w.tabGroup.singleTab.exportModePanel.exportModeGroup.add("dropdownlist", [0, 0, 330, 20], ['Layers', 'Groups']);
    w.tabGroup.singleTab.ddTypeIndex.onChange = function () {
        singleExportType = this.selection.index;
    }
    w.tabGroup.singleTab.ddTypeIndex.items[singleExportType].selected = true;

    // Export Type
    w.tabGroup.singleTab.exportTypePanel = w.tabGroup.singleTab.add('panel', undefined, "File Setting");

    // Export Type Preferences
    w.tabGroup.singleTab.exportTypePanel.exportTypeGroup = w.tabGroup.singleTab.exportTypePanel.add('group');

    w.tabGroup.singleTab.exportTypePanel.exportTypeGroup.add('StaticText', [0, 0, 70, 20], 'Format:');
    w.tabGroup.singleTab.exportTypePanel.exportTypeGroup.ddFileType = w.tabGroup.singleTab.exportTypePanel.exportTypeGroup.add("dropdownlist", [0, 0, 330, 20], ['JPEG', 'PNG']);
    w.tabGroup.singleTab.exportTypePanel.exportTypeGroup.ddFileType.onChange = function () {
        hideAllFileTypePanel(w);
        switch (this.selection.index) {
            case jpegIndex:
                w.tabGroup.singleTab.optionsPanel.text = 'JPEG Options';
                w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.show();
                break;
            case pngIndex:
                w.tabGroup.singleTab.optionsPanel.text = 'PNG Options';
                w.tabGroup.singleTab.optionsPanel.pngOptionGroup.show();
                break;
        }
    }

    // Options Panel
    w.tabGroup.singleTab.optionsPanel = w.tabGroup.singleTab.add('panel', undefined, "Options");
    w.tabGroup.singleTab.optionsPanel.orientation = 'stack';
    w.tabGroup.singleTab.optionsPanel.alignment = 'fill';
    w.tabGroup.singleTab.optionsPanel.alignChildren = 'fill';

    // PNG Options
    w.tabGroup.singleTab.optionsPanel.pngOptionGroup = w.tabGroup.singleTab.optionsPanel.add('group');
    w.tabGroup.singleTab.optionsPanel.pngOptionGroup.orientation = 'column';

    w.tabGroup.singleTab.optionsPanel.pngOptionGroup.visibleOnly = w.tabGroup.singleTab.optionsPanel.pngOptionGroup.add("checkbox", [50, 0, 300, 20], "Visible Layer/Group Only");
    w.tabGroup.singleTab.optionsPanel.pngOptionGroup.visibleOnly.value = exportOptions.visibleOnly;

    w.tabGroup.singleTab.optionsPanel.pngOptionGroup.pngTransparency = w.tabGroup.singleTab.optionsPanel.pngOptionGroup.add("checkbox", [50, 0, 300, 20], "Transparency");
    w.tabGroup.singleTab.optionsPanel.pngOptionGroup.pngTransparency.value = exportOptions.pngTransparency;

    w.tabGroup.singleTab.optionsPanel.pngOptionGroup.pngInterlaced = w.tabGroup.singleTab.optionsPanel.pngOptionGroup.add("checkbox", [50, 0, 300, 20], "Interlaced");
    w.tabGroup.singleTab.optionsPanel.pngOptionGroup.pngInterlaced.value = exportOptions.pngInterlaced;

    w.tabGroup.singleTab.optionsPanel.pngOptionGroup.pngTrim = w.tabGroup.singleTab.optionsPanel.pngOptionGroup.add("checkbox", [50, 0, 300, 20], "Trim");
    w.tabGroup.singleTab.optionsPanel.pngOptionGroup.pngTrim.value = exportOptions.pngTrim;

    w.tabGroup.singleTab.optionsPanel.pngOptionGroup.png8 = w.tabGroup.singleTab.optionsPanel.pngOptionGroup.add("checkbox", [50, 0, 300, 20], "PNG-8");
    w.tabGroup.singleTab.optionsPanel.pngOptionGroup.png8.value = exportOptions.png8;

    w.tabGroup.singleTab.optionsPanel.pngOptionGroup.icc = w.tabGroup.singleTab.optionsPanel.pngOptionGroup.add("checkbox", [50, 0, 300, 20], "Embed Color Profile");
    w.tabGroup.singleTab.optionsPanel.pngOptionGroup.icc.value = exportOptions.icc;

    w.tabGroup.singleTab.optionsPanel.pngOptionGroup.visible = (exportOptions.fileType == pngIndex);

    // JPEG Options
    w.tabGroup.singleTab.optionsPanel.jpegOptionGroup = w.tabGroup.singleTab.optionsPanel.add('group');
    w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.orientation = 'column';

    w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.visibleOnly = w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.add("checkbox", [50, 0, 300, 20], "Visible Layer/Group Only");
    w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.visibleOnly.value = exportOptions.visibleOnly;

    w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.icc = w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.add("checkbox", [50, 0, 300, 20], "Embed Color Profile");
    w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.icc.value = exportOptions.icc;

    w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.jpegQualityGroup = w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.add('group');
    w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.jpegQualityGroup.jpegQualityLabel = w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.jpegQualityGroup.add("statictext", [0, 0, 70, 20], 'Image Quality:');
    w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.jpegQualityGroup.jpegQuality = w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.jpegQualityGroup.add('slider', undefined, exportOptions.jpegQuality, 0, 12);
    w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.jpegQualityGroup.jpegQuality.preferredSize = [300, -1];
    w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.jpegQualityGroup.jpegQualityText = w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.jpegQualityGroup.add("statictext", [0, 0, 20, 20], exportOptions.jpegQuality.toString());
    w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.jpegQualityGroup.jpegQuality.onChanging = function () {
        this.value = Math.round(this.value);
        w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.jpegQualityGroup.jpegQualityText.text = this.value;
    }

    w.tabGroup.singleTab.optionsPanel.jpegOptionGroup.visible = (exportOptions.fileType == jpegIndex);

    w.tabGroup.singleTab.exportTypePanel.exportTypeGroup.ddFileType.items[exportOptions.fileType].selected = true;
}


///////////////////////////////////////////////////////////////////////////////
// Function: hideAllFileTypePanel
// Usage: hide all the panels in the common actions
// Input: window is the dialog for this script
// Return: <none>, all panels are now hidden
///////////////////////////////////////////////////////////////////////////////
function hideAllFileTypePanel(window) {
    window.tabGroup.singleTab.optionsPanel.jpegOptionGroup.hide();
    window.tabGroup.singleTab.optionsPanel.pngOptionGroup.hide();
}


///////////////////////////////////////////////////////////////////////////////
// Function: initExportOptions
// Usage: create our default parameters
// Input: a new Object
// Return: a new object with params set to default
///////////////////////////////////////////////////////////////////////////////
function initExportOptions(exportOptions) {
    exportOptions.destination = new String("");
    exportOptions.fileNamePrefix = new String("untitled_");
    exportOptions.visibleOnly = true;
    exportOptions.fileType = pngIndex;
    exportOptions.icc = true;
    exportOptions.pngTransparency = true;
    exportOptions.pngInterlaced = false;
    exportOptions.pngTrim = false;
    exportOptions.png8 = false;
    exportOptions.jpegQuality = 8;

    try {
        exportOptions.destination = Folder(app.activeDocument.fullName.parent).fsName; // destination folder
        var tmp = app.activeDocument.fullName.name;
        exportOptions.fileNamePrefix = decodeURI(tmp.substring(0, tmp.indexOf("."))); // filename body part
    } catch (e) {
        exportOptions.destination = new String("");
        exportOptions.fileNamePrefix = app.activeDocument.name; // filename body part
    }
}



///////////////////////////////////////////////////////////////////////////////
// Function: objectToDescriptor
// Usage: create an ActionDescriptor from a JavaScript Object
// Input: JavaScript Object (o)
//        object unique string (s)
// Return: ActionDescriptor
// NOTE: Only boolean, string, number and UnitValue are supported.
// REUSE: This routine is used in other scripts. Please update those if you 
//        modify. I am not using include or eval statements as I want these 
//        scripts self contained.
///////////////////////////////////////////////////////////////////////////////
function objectToDescriptor(o, s) {
    var d = new ActionDescriptor;
    var l = o.reflect.properties.length;
    d.putString(app.charIDToTypeID('Msge'), s);
    for (var i = 0; i < l; i++) {
        var k = o.reflect.properties[i].toString();
        if (k == "__proto__" || k == "__count__" || k == "__class__" || k == "reflect")
            continue;
        var v = o[k];
        k = app.stringIDToTypeID(k);
        switch (typeof (v)) {
            case "boolean":
                d.putBoolean(k, v);
                break;
            case "string":
                d.putString(k, v);
                break;
            case "number":
                d.putDouble(k, v);
                break;
            default:
                {
                    if (v instanceof UnitValue) {
                        var uc = new Object;
                        uc["px"] = charIDToTypeID("#Rlt"); // unitDistance
                        uc["%"] = charIDToTypeID("#Prc"); // unitPercent
                        d.putUnitDouble(k, uc[v.type], v.value);
                    } else {
                        throw (new Error("Unsupported type in objectToDescriptor " + typeof (v)));
                    }
                }
        }
    }
    return d;
}


///////////////////////////////////////////////////////////////////////////////
// Function: descriptorToObject
// Usage: update a JavaScript Object from an ActionDescriptor
// Input: JavaScript Object (o), current object to update (output)
//        Photoshop ActionDescriptor (d), descriptor to pull new params for object from
//        object unique string (s)
//        JavaScript Function (f), post process converter utility to convert
// Return: Nothing, update is applied to passed in JavaScript Object (o)
// NOTE: Only boolean, string, number and UnitValue are supported, use a post processor
//       to convert (f) other types to one of these forms.
// REUSE: This routine is used in other scripts. Please update those if you 
//        modify. I am not using include or eval statements as I want these 
//        scripts self contained.
///////////////////////////////////////////////////////////////////////////////
function descriptorToObject(o, d, s) {
    var l = d.count;

    if (l) {
        var keyMessage = app.charIDToTypeID('Msge');
        if (d.hasKey(keyMessage) && (s != d.getString(keyMessage)))
            return;
    }

    for (var i = 0; i < l; i++) {
        var k = d.getKey(i); // i + 1 ?
        var t = d.getType(k);
        strk = app.typeIDToStringID(k);

        switch (t) {
            case DescValueType.BOOLEANTYPE:
                o[strk] = d.getBoolean(k);
                break;
            case DescValueType.STRINGTYPE:
                o[strk] = d.getString(k);
                break;
            case DescValueType.DOUBLETYPE:
                o[strk] = d.getDouble(k);
                break;
            case DescValueType.UNITDOUBLE:
                var uc = new Object;
                uc[charIDToTypeID("#Rlt")] = "px"; // unitDistance
                uc[charIDToTypeID("#Prc")] = "%"; // unitPercent
                uc[charIDToTypeID("#Pxl")] = "px"; // unitPixels
                var ut = d.getUnitDoubleType(k);
                var uv = d.getUnitDoubleValue(k);
                o[strk] = new UnitValue(uv, uc[ut]);
                break;
            case DescValueType.INTEGERTYPE:
            case DescValueType.ALIASTYPE:
            case DescValueType.CLASSTYPE:
            case DescValueType.ENUMERATEDTYPE:
            case DescValueType.LISTTYPE:
            case DescValueType.OBJECTTYPE:
            case DescValueType.RAWTYPE:
            case DescValueType.REFERENCETYPE:
            default:
                throw (new Error("Unsupported type in descriptorToObject " + t));
        }
    }
}
