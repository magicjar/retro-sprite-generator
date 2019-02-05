/***
/* Somewhat simplistic spritesheet generation script
/* Author: @bogdan_rybak github.com/bogdanrybak
/*/

#target photoshop
function RetroSpriteGenerator() {

    var dlg,
        sheetName,
        frames = getFrameCount(),
        currentDoc,
        columns = 4,
        rows = 4,
        selectedScale = 0,
        scaleNumber = 0,
        selectedResample = 0,
        resampleMethod = 0,
        paddingUniform = 0,
        paddingLeft = 0,
        paddingRight = 0,
        paddingTop = 0,
        paddingBottom = 0,
        spriteWidth,
        spriteHeight,
        spriteResolution,
        selectedIndex = 0,
        uniformIndex = 0,
        separateIndex = 1,
        spacing = 0,
        offset = 0;

    function createSpriteSheet(onFinished) {
        try {
            dlg.hide();

            columns = dlg.columns.text;
            rows = dlg.rows.text;
            spacing = dlg.spacing.text;
            offset = dlg.offset.text;
            
            sheetName = sheetName + "_" + currentDoc.width.value + "x" + currentDoc.height.value;
            var startFrame = parseInt(dlg.startFrame.text);
            
            // get padding options from dialogue
            switch (selectedIndex) {
                case uniformIndex:
                    paddingUniform = parseInt(dlg.paddingUniform.text);
                    paddingLeft = paddingTop = paddingRight = paddingBottom = paddingUniform;
                    break;
                case separateIndex:
                    paddingLeft = parseInt(dlg.paddingLeft.text);
                    paddingRight = parseInt(dlg.paddingRight.text);
                    paddingTop = parseInt(dlg.paddingTop.text);
                    paddingBottom = parseInt(dlg.paddingBottom.text);
                    break;
            }

            var spriteWidthPadded = spriteWidth + paddingLeft + paddingRight;
            var spriteHeightPadded = spriteHeight + paddingTop + paddingBottom;

            var spriteSheetDoc = app.documents.add(spriteWidthPadded * columns, spriteHeightPadded * rows, 72, sheetName);
            var tempDoc = app.documents.add(spriteWidthPadded, spriteHeightPadded, 72, sheetName + "_tmp");

            var cellSize = getSelectionShape(spriteWidth, 0, spriteHeight, 0);

            var currentColumn = 0,
                currentRow = 0;

            if (frames > 0) {
                for (var i = 0; i < frames; i++) {
                    app.activeDocument = currentDoc;
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

                        switch (selectedIndex) {
                            case uniformIndex:
                                layer.translate(currentColumn * spriteWidthPadded, currentRow * spriteHeightPadded);
                                break;
                            case separateIndex:
                                layer.translate(currentColumn * spriteWidthPadded + paddingLeft - (paddingLeft + paddingRight) / 2, currentRow * spriteHeightPadded + paddingTop - (paddingTop + paddingBottom) / 2);
                                break;
                        }
                    }

                    currentColumn++;

                    if (currentColumn >= columns) {
                        currentRow++;
                        currentColumn = 0;
                    }
                }

                app.activeDocument = tempDoc;
                app.activeDocument.close(SaveOptions.DONOTSAVECHANGES);

                app.activeDocument = currentDoc;
                app.activeDocument.selection.deselect();

                app.activeDocument = spriteSheetDoc;

                // Remove the default background layer
                app.activeDocument.artLayers.getByName(app.activeDocument.backgroundLayer.name).remove();

                // Resize and Resample Image
                if (scaleNumber > 1) {
                    spriteSheetDoc.resizeImage(spriteSheetDoc.width * scaleNumber, spriteSheetDoc.height * scaleNumber, spriteResolution, resampleMethod);
                }

                if (onFinished) {
                    onFinished(spriteSheetDoc, currentDoc);
                }
            }
            exit();
        } catch (ex) {
            alert("An error occured, please submit a bug report. Error: " + ex);
        }
    }

    // Count the number of frames in the timeline.
    function getFrameCount() {
        for( var f = 1; f < 999; f++ ) {
            if ( selectFrame(f) == false ) {
                return f - 1;
            }
        }
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
        } catch(e) {
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
        var selectedFile = File.saveDialog("Save as PNG", "*.png");
        if (selectedFile == null) {
            return;
        }

        var finished = function (spriteSheet, originalDoc) {
            var o = new ExportOptionsSaveForWeb();
            o.format = SaveDocumentType.PNG;
            o.PNG8 = false;
            o.transparency = true;
            o.interlaced = false;
            o.includeProfile = false;
            o.quality = 100;

            spriteSheet.exportDocument(selectedFile, ExportType.SAVEFORWEB, o);

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

        // dlg.docTypePanel = dlg.add('panel', undefined, 'Document Type');
        // dlg.docTypePanel.alignment = ['fill', 'top'];

        // dlg.docTypeGroup = dlg.docTypePanel.add('group');
        // dlg.docTypeGroup.alignment = ['left', 'top'];

        // dlg.docType = dlg.docTypeGroup.add('radiobutton', undefined, 'Frame Animation');
        // dlg.docType = dlg.docTypeGroup.add('radiobutton', undefined, 'Layers');
        // dlg.docType = dlg.docTypeGroup.add('radiobutton', undefined, 'Groups');
        // dlg.docTypeGroup.children[0].value = true;

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

        dlg.dimensionsGroup.add('StaticText', [0, 0, 60, 25], 'Rows:');
        dlg.rows = dlg.dimensionsGroup.add('EditText', undefined, rows);
        dlg.rows.characters = 5;

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

        // Spacing & Offset

        dlg.spacoffPanel = dlg.add('panel', undefined, "Offset & Spacing");
        dlg.spacoffPanel.alignment = ['fill', 'top'];

        // Spacing & Offset Preferences

        dlg.spacoffGroup = dlg.spacoffPanel.add('group');
        dlg.spacoffGroup.alignment = ['left', 'top'];

        dlg.spacoffGroup.add('StaticText', [0, 0, 60, 25], 'Offset:');
        dlg.offset = dlg.spacoffGroup.add('EditText', undefined, offset);
        dlg.offset.characters = 5;

        dlg.spacoffGroup.add('StaticText', [0, 0, 60, 25], 'Spacing:');
        dlg.spacing = dlg.spacoffGroup.add('EditText', undefined, spacing);
        dlg.spacing.characters = 5;
        

        // Padding

        dlg.paddingTypePanel = dlg.add('panel', undefined, "Padding Type");
        dlg.paddingTypePanel.alignment = ['fill', 'top'];

        // Padding Preferences: Padding Type, Save Padding Data (in data file)

        dlg.paddingTypePanel.paddingPrefs = dlg.paddingTypePanel.add('group');
        dlg.paddingTypePanel.paddingPrefs.alignment = ['left', 'top'];

        dlg.ddPaddingType = dlg.paddingTypePanel.paddingPrefs.add("dropdownlist", undefined, ['Uniform', 'Separate']);
        dlg.ddPaddingType.alignment = 'left'

        dlg.ddPaddingType.onChange = function () {
            hideAllPaddingPanel(dlg);
            selectedIndex = this.selection.index;
            switch (this.selection.index) {
                case uniformIndex:
                    dlg.paddingTypePanel.paddingOptions.text = 'Uniform Options'
                    dlg.paddingTypePanel.paddingOptions.uniformPaddingOptions.show();
                    break;
                case separateIndex:
                    dlg.paddingTypePanel.paddingOptions.text = 'Separate Options'
                    dlg.paddingTypePanel.paddingOptions.separatePaddingOptions.show();
                    break;
            }
        }

        dlg.separatePaddingData = dlg.paddingTypePanel.paddingPrefs.add('Checkbox', undefined, 'Separate Padding Data');
        dlg.separatePaddingData.alignment = 'left'

        // Padding Options

        dlg.paddingTypePanel.paddingOptions = dlg.paddingTypePanel.add('panel', undefined, 'Options');
        dlg.paddingTypePanel.paddingOptions.alignment = 'fill';
        dlg.paddingTypePanel.paddingOptions.orientation = 'stack';

        // Uniform Padding Options

        dlg.paddingTypePanel.paddingOptions.uniformPaddingOptions = dlg.paddingTypePanel.paddingOptions.add('group');
        dlg.paddingTypePanel.paddingOptions.uniformPaddingOptions.alignment = ['left', 'top'];

        dlg.paddingTypePanel.paddingOptions.uniformPaddingOptions.add('StaticText', [0, 0, 60, 25], 'Padding:');
        dlg.paddingUniform = dlg.paddingTypePanel.paddingOptions.uniformPaddingOptions.add('EditText', undefined, paddingUniform);
        dlg.paddingTypePanel.paddingOptions.uniformPaddingOptions.visible = (selectedIndex == uniformIndex);

        // Separate Padding Options

        dlg.paddingTypePanel.paddingOptions.separatePaddingOptions = dlg.paddingTypePanel.paddingOptions.add('group');
        dlg.paddingTypePanel.paddingOptions.separatePaddingOptions.alignment = ['left', 'top'];

        dlg.paddingTypePanel.paddingOptions.separatePaddingOptions.add('StaticText', [0, 0, 60, 25], 'Padding');
        dlg.paddingTypePanel.paddingOptions.separatePaddingOptions.add('StaticText', [0, 0, 40, 25], 'Left:');
        dlg.paddingLeft = dlg.paddingTypePanel.paddingOptions.separatePaddingOptions.add('EditText', undefined, paddingLeft);

        dlg.paddingTypePanel.paddingOptions.separatePaddingOptions.add('StaticText', [0, 0, 40, 25], 'Top:');
        dlg.paddingTop = dlg.paddingTypePanel.paddingOptions.separatePaddingOptions.add('EditText', undefined, paddingTop);

        dlg.paddingTypePanel.paddingOptions.separatePaddingOptions.add('StaticText', [0, 0, 40, 25], 'Right:');
        dlg.paddingRight = dlg.paddingTypePanel.paddingOptions.separatePaddingOptions.add('EditText', undefined, paddingRight);

        dlg.paddingTypePanel.paddingOptions.separatePaddingOptions.add('StaticText', [0, 0, 40, 25], 'Bottom:');
        dlg.paddingBottom = dlg.paddingTypePanel.paddingOptions.separatePaddingOptions.add('EditText', undefined, paddingBottom);

        dlg.paddingTypePanel.paddingOptions.separatePaddingOptions.visible = (selectedIndex == separateIndex);

        // Action Buttons

        dlg.buttons = dlg.add('group');
        dlg.buttons.cancel = dlg.buttons.add('button', undefined, 'Cancel');
        dlg.buttons.cancel.onClick = exit;

        dlg.buttons.createButton = dlg.buttons.add('button', undefined, 'Generate document');
        dlg.buttons.createButton.onClick = createSpriteSheet;

        dlg.buttons.saveAsPNGBtn = dlg.buttons.add('button', undefined, 'Save as PNG');
        dlg.buttons.saveAsPNGBtn.onClick = saveAsPNG;

        dlg.ddScaleNumber.items[selectedScale].selected = true;
        dlg.ddResampleMethod.items[selectedResample].selected = true;
        dlg.ddPaddingType.items[selectedIndex].selected = true;

        dlg.show();

    }

    function init() {
        if ( frames == 0 ) { 
            alert("No animation frames were found.\nThis script requires minimum of 1 frame animation to create a sprite sheet.");
            return;
        }

        currentDoc = app.activeDocument;
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
} catch(e) {
    alert('There is no active document.');
}

function hideAllPaddingPanel(dlg) {
    dlg.paddingTypePanel.paddingOptions.uniformPaddingOptions.hide();
    dlg.paddingTypePanel.paddingOptions.separatePaddingOptions.hide();
}