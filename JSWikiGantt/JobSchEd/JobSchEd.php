<?php
/**
	JobSchEd - Job Schedule Edit

	Needed external modules:
	* JSWikiGantt ver. 0.3.0 or higher (includes date-functions.js)
	* sftJSmsg ver 0.3.0 or higher
 
    Copyright:  ©2010-2011 Maciej Jaros (pl:User:Nux, en:User:EcceNux)
 
	To activate this extension, add the following into your LocalSettings.php file:
	require_once("$IP/extensions/JobSchEd/JobSchEd.php");
	OR
	you could also simply add this script to your wiki: edit_calend.modules.mini.js
	
	@ingroup Extensions
	@author Maciej Jaros <egil@wp.pl>
	@license http://www.gnu.org/copyleft/gpl.html GNU General Public License 2.0 or later
*/
 
/**
 * Protect against register_globals vulnerabilities.
 * This line must be present before any global variable is referenced.
 */
if( !defined( 'MEDIAWIKI' ) ) {
	echo( "This is an extension to the MediaWiki package and cannot be run standalone.\n" );
	die( -1 );
}

//
// Extension credits that will show up on Special:Version
//
$wgExtensionCredits['parserhook'][] = array(
	'path'         => __FILE__,
	'name'         => 'JobSchEd',
	'version'      => '0.8.0',
	'author'       => 'Maciej Jaros', 
	'url'          => 'http://www.mediawiki.org/wiki/Extension:JobSchEd',
	'description'  => ''
		." This extension edits ''jsgantt'' tag contents to create specific diagrams of urlopy and stuff :-)."
);

//
// Absolute path
//
$wgJobSchEdDir = rtrim(dirname(__FILE__), "/\ ");
$wgJobSchEdScriptDir = "{$wgScriptPath}/extensions/JobSchEd";
//
// Configuration file
//
//require_once ("{$wgJobSchEdDir}/JobSchEd.config.php");

//
// Class setup
//
$wgAutoloadClasses['ecSimpleJSLoader'] = "{$wgJobSchEdDir}/JobSchEd.loader.php";

//
// add hook setup and init class/object
//
$wgHooks['BeforePageDisplay'][] = 'efJobSchEdSetup';
function efJobSchEdSetup($wgOut)
{
	global $wgJobSchEdDir;

	$oLoader = new ecSimpleJSLoader($wgJobSchEdDir);
	
	// "modules"
	$strMiniModulesFile = $oLoader->createMiniModules(array(
		'_core',
		'form_cr',
		'parsing',
		'wikicodebuilder',
		'msgs_mod_p',
		'msgs_mod_t',
		'msgs_list_p',
		'msgs_list_t',
	));

	# "addHeadItem makes the loading of js too early and causes error"
	#$wgOut->addHeadItem('JobSchEdJSmini', Html::linkedScript(efJobSchEdgetCSSJSLink($strMiniModulesFile)));
	$wgOut->addScriptFile(efJobSchEdgetCSSJSLink($strMiniModulesFile)); 	


	// Note! This name should be the same as in other extension
	//! @todo Make this optional
	#$wgOut->addHeadItem('sftJSmsg' , Html::linkedScript( efJobSchEdgetCSSJSLink("lib/sftJSmsg.js") ) );
	#$wgOut->addScriptFile(efJobSchEdgetCSSJSLink("lib/jquery-3.2.1.min.js"));
	#$wgOut->addScriptFile(efJobSchEdgetCSSJSLink("lib/jquery-ui.min.js"));
	$wgOut->addScriptFile(efJobSchEdgetCSSJSLink("lib/sftJSmsg.js"));
	$wgOut->addScriptFile(efJobSchEdgetCSSJSLink("lib/node_modules/moment/moment.js"));
	$wgOut->addScriptFile(efJobSchEdgetCSSJSLink("lib/node_modules/moment-business-days/index.js"));
	$wgOut->addScriptFile(efJobSchEdgetCSSJSLink("lib/jscolor.js"));
	#$wgOut->addScriptFile(efJobSchEdgetCSSJSLink("lib/dist/js/bootstrap-colorpicker.js"));


	// Note! This name should be the same as in JSWikiGantt extension
	#$wgOut->addHeadItem('jsganttDateJS' , Html::linkedScript( efJobSchEdgetCSSJSLink("date-functions.js") ) );
	$wgOut->addScriptFile(efJobSchEdgetCSSJSLink("date-functions.js"));


	return true;
}

$wgJobSchEdtScriptVersion = 1;
function efJobSchEdgetCSSJSLink($strFileName)
{
	global $wgJobSchEdtScriptVersion, $wgJobSchEdScriptDir;
	
	return "{$wgJobSchEdScriptDir}/{$strFileName}?{$wgJobSchEdtScriptVersion}";
}
