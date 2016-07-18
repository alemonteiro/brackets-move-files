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
		_domainPath = ExtensionUtils.getModulePath(module, "node/MoveFilesDomain.js"),
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

	// Console Logging utils
	var c = {
		parse: function(text) {
			return (typeof text === 'string' ? text : (typeof text.toJson === 'function' ? text.toJson() : JSON.stringify(text)));
		},
		tag 	: 'alemonteiro.moveFiles => ',
		log 	: function(text) { console.log(this.tag + this.parse(text)); },
		error	: function(text) { console.error(this.tag + this.parse(text)); },
		warn	: function(text) { console.warn(this.tag + this.parse(text)); }
	},

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
		// dragging element is upon an holder
		else if ( is_dragging ) {
			$(this).addClass('drag-holder');
			evt.stopPropagation();
			evt.preventDefault();
		}
	},

	// Handles mouse down on tree itens <a>
	onMouseDown = function(evt) {
		c.log('Mouse Down: ' + $(this).text());
		if ( ! is_pressed && ! is_moving && ! is_dragging ) {
			$(this).data('drag-pressed', 1);
			is_pressed = true;
			is_moving = false;
			is_dragging = false;
		}
	},

	// Handles mouse down on tree itens <a> and <ul>
	onMouseUp = function(evt) {

		if ( is_moving ) 		return c.warn('Mouse up but files are still moving');
		if ( ! is_dragging ) {
			is_pressed = false;
			return;
		}

		// Move if not released upon an item that is not itself
		if ( $(this).is('a') && $(this).data('drag-pressed') !== 1 ) {
			evt.preventDefault();
			evt.stopPropagation();
			c.log('Dropped On: ' + $(this).text());
			move(evt, getItemFullPath($pressedEl), getItemFullPath($(this)), $pressedEl, $(this));
		}
		// Move also if released upon an container on the tree view
		else if ( $(this).is('ul') && $(this).data('reactid') )
		{
			evt.preventDefault();
			evt.stopPropagation();
			if ( $(this).prev().is('a') ) {
				c.log('Dropped On: ' + $(this).prev().text());
				move(evt, getItemFullPath($pressedEl), getItemFullPath($(this).prev()), $pressedEl, $(this));
			}
			else {
				c.log('Dropped on project root');
				move(evt, getItemFullPath($pressedEl), ProjectManager.getProjectRoot().fullPath,  $pressedEl, $(this));
			}
		}
		// Cancel movement if dropped elsewhere
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
		c.log('Drag Start: ' + $a.text());
		is_dragging = true;
		$a.data('drag-pressed', 1).addClass('dragging');
		$pressedEl = $a;
	},

	// Reset states and listeners
	waitForDrag = function() {
		c.log('Waiting for drag');
		is_moving = false;
		is_pressed = false;
		is_dragging = false;

		if ( $dropTarget ) $dropTarget.removeClass('drag-holder');
		if ( $pressedEl ) $pressedEl.removeClass('drag-holder dragging').data('drag-pressed', 0);

		$(".drag-holder", $filesContainer).removeClass('drag-holder');

		$dropTarget = undefined;
		$pressedEl = undefined;
	},

	// Use node MoveFilesDomain to make the move
	move = function(evt, source, dist, $a, $holder) {
		is_moving = true;
		is_dragging = false;
		is_pressed = false;
		if ( ! _nodeDomain.ready() ) {
			c.error('NodeDomain ' + _domainName + ' is not ready!');
			waitForDrag();
			return;
		}
		var label = evt.ctrlKey ? 'Copy ' : 'Move ';
		_nodeDomain.exec(evt.ctrlKey ? 'copy' : 'move', source, dist).done(function(destination) {
			c.log(label + 'Completed To ' + destination);
			ProjectManager.refreshFileTree();
			waitForDrag();
		}).fail(function(err) {
			c.error(label + 'Error => ' + c.parse(err));
			waitForDrag();
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
