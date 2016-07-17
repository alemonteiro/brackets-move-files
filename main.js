/*jshint node: true, jquery: true*/
/* globals brackets, define, Mustache */
/*!
 * Brackets Selected Char Counter
 *
 * @author Alê Monteiro
 * @license MIT
 * @home https://github.com/alemonteiro/selected-char-count
 */
define(function (require, exports, module) {
	'use strict';

	// Get dependencies.
	var EditorManager = brackets.getModule('editor/EditorManager'),
		AppInit = brackets.getModule('utils/AppInit'),
		ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
		ProjectManager = brackets.getModule('project/ProjectManager'),
		NodeDomain = brackets.getModule("utils/NodeDomain"),

		// node domain
		_domainName = "BracketsMoveFilesDomain",
		_domainPath = ExtensionUtils.getModulePath(module, "node/MoveFilesDomain"),
		_nodeDomain,

		// UI Elements
		$filesContainer,
		$dropTarget,
		$pressedEl,

		// States
		is_pressed = false,
		is_dragging = false,
		is_moving = false;

	// Load stylesheet.
	ExtensionUtils.loadStyleSheet(module, 'main.css');

	var
	// Go thru the UL parents from the item to get the path of the tree item
	_getTreeItemPath = function($item) {
		var txt = $.trim($item.text());
		if ( $item.parent().parent().is('ul') ) {
			if ( $item.parent().parent().prev('a').length === 1 ) {
				txt = _getTreeItemPath($item.parent().parent().prev('a')) + '/' + txt;
			}
		}
		return txt;
	},

	// Get the full path of an item
	getItemFullPath = function($item) {
		return ProjectManager.getProjectRoot().fullPath + _getTreeItemPath($item);
	},

	// Handles mouse down on tree itens <a> and <ul>
	onMouseMove = function(evt) {
		if ( is_moving ) return;

		if ( is_pressed && ! is_dragging && $(this).data('drag-pressed') === 1 ) {
			dragStart(evt, $(this));
		}
		// dragging element is upon
		else if ( is_dragging ) {
			$(this).addClass('drag-holder');
			evt.stopPropagation();
			evt.preventDefault();
		}
	},

	// Handles mouse down on tree itens <a>
	onMouseDown = function(evt) {
		console.log('mouse down: ' + $(this).text());
		if ( ! is_pressed && ! is_moving && ! is_dragging ) {
			$(this)
				.data('drag-pressed', 1);
			$pressedEl = $(this);
			is_pressed = true;
			is_moving = false;
			is_dragging = false;
		}
	},

	// Handles mouse down on tree itens <a> and <ul>
	onMouseUp = function(evt) {

		if ( is_moving ) return;
		if ( ! is_dragging ) {
			is_pressed = false;
			return;
		}

		// Move if not released upon itself
		if ( $(this).is('a') && $(this).data('drag-pressed') !== 1 ) {
			evt.preventDefault();
			evt.stopPropagation();
			move(evt, getItemFullPath($pressedEl), getItemFullPath($(this)), $pressedEl, $(this));
		}
		else if ( $(this).is('ul') && $(this).data('reactid') )
		{
			evt.preventDefault();
			evt.stopPropagation();
			if ( $(this).prev().is('a') ) {
				move(evt, getItemFullPath($pressedEl), getItemFullPath($(this).prev()), $pressedEl, $(this));
			}
			else {
				move(evt, getItemFullPath($pressedEl), ProjectManager.getProjectRoot().fullPath,  $pressedEl, $(this));
			}
		}
		// Cancel movement
		else {
			waitForDrag();
		}
	},

	// Remove 'drop-holder' effect
	onMouseOut = function(evt) {
		if ( is_dragging || is_moving ) $(this).removeClass('drag-holder');
	},

	// Stop listening to mousedown and start listening to move and up(drop)
	dragStart = function(evt, $a) {
		console.log('drag start: ' + $a.text());
		is_dragging = true;
		$a.data('drag-pressed', 1).addClass('dragging');
		$pressedEl = $a;
	},

	// Reset states and listeners
	waitForDrag = function() {
		console.log('wait for drag');
		is_moving = false;
		is_pressed = false;
		is_dragging = false;

		if ( $dropTarget ) $dropTarget.removeClass('drag-holder');
		if ( $pressedEl ) $pressedEl.removeClass('drag-holder dragging').data('drag-pressed', 0);

		$(".drag-holder", $filesContainer).removeClass('drag-holder');

		$dropTarget = undefined;
		$pressedEl = undefined;

		/*
		.on('mouseup', function(evt) {
			if ( is_pressed && $pressedEl ) {
				var source = getItemFullPath($pressedEl),
					dest = ProjectManager.getProjectRoot().fullPath;

				evt.preventDefault();
				evt.stopPropagation();

				move(source, dest, $pressedEl, $(this));
			}
		});*/
	},

	// Use node MoveFilesDomain to make the move
	move = function(evt, source, dist, $a, $holder) {
		is_moving = true;
		is_dragging = false;
		is_pressed = false;
		_nodeDomain.exec(evt.ctrlKey ? 'copy' : 'move', source, dist).done(function() {
			waitForDrag();
			ProjectManager.refreshFileTree();
		}).fail(function(err) {
			waitForDrag();
			console.log('Move Error: ' + JSON.stringify(err));
		});
	};

	// Once extension is ready
	AppInit.appReady(function () {

		// Get domain provider
		_nodeDomain = new NodeDomain(_domainName, _domainPath);

		// Cache tree view file container and register listeners
		$filesContainer = $("#project-files-container")

			// Cancel mousedown tracking
			.on('mousedown', 'ul > li > a', onMouseDown)
			// Track mouse move on the element to start the drag and on folders to make it look like a place holder
			.on('mousemove', 'ul > li > a', onMouseMove)
			// Remove drag-holder
			.on('mouseout', 'ul > li > a', onMouseOut)
			// Mouse up / Do Move / Cancel
			.on('mouseup', 'ul > li > a', onMouseUp);

		$("body").on('mouseup', onMouseUp);
	});

});
