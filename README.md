brackets-move-files
=========================

Enalbes drag and drop of files and folders on the tree view.

## Getting Started

1. Open Extension Manager by clicking the building-blocky icon on the right side of Brackets or File -> Extension Manager;
2. Search for Move Files;
3. Click Install;
4. Done =)

## Usage

Click and drag (holding the mousedown) files and folders to other locations, drop to move.

The dragging file will be colored 'darkred' and the drop holders will have an semi-transparent dark blue background.

Hold ctrl to copy files instead of moving (must be held upon mouse relase/drop)

## Details 

1. Files are never overwrited. Copy is canceled if same name file already exists and copy will rename the dropped file.
2. If a file or folder is dropped on top of a file, the move or copy will be made to the folder of that file (use this to move/copy files to the root directory)
3. There's no multiple selection, do not bother trying to hold shift for now =)

## For Dev / Git Install

The required dependencies are not on this repository. Install them from the command line.

Go the the extension folder path inside the node folder and run `npm install`, like this

```
cd Brackets/extensions/user/
mkir alemonteiro.brackets-move-files
git clone https://github.com/alemonteiro/brackets-move-files alemonteiro.brackets-move-files
cd alemonteiro.brackets-move-files/node
npm install
```

You can fork and use your own repo as well.

### Changelog

#### 0.2.0

* Fixed some path and logic issues on move and copy
* Changed usage from fs.move to fs.copy + fs.remove
* Changed event listener from MouseMove to MouseOut/MoveOver
* Changed drop background from black to blue (better visibility)

#### 0.1.2

* Ajusted log output and check if NodeDomain is ready

#### 0.1.1

* Added more log to console
* Updated read.me