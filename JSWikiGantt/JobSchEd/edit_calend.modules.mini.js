window.onload = function () {

    //var oJobSchEd; if(!oJobSchEd) oJobSchEd = {};
    window.oJobSchEd = {};

    Array.prototype.last = function () {
        return this[this.length - 1];
    };
    Array.prototype.secondLast = function () {
        return this[this.length - 2];
    };
    oJobSchEd.ver = oJobSchEd.version = '1.0.0';
    oJobSchEd.conf = {"" : ""
        , strFallbackLang : 'en'
        , strLang         : mw.config.values.wgContentLanguage   // Language to be used (note this probably shouldn't be user selectable, should be site wide)
        , isAutoAddLogged : true
                                       // Note that this doesn't mean that any task is added and so diagram will be changed only if the users adds a task.
        ,strFormat : 'Y-m-d'
        ,reGantMatch : /(<jsgantt[^>]*>)([\s\S]*)(<\/jsgantt>)/
        ,isActivitiesIdentfiedByName : true
        
        ,currentColor : '8CB6CE' //dynamically changed
        ,defaultChecked : false //dynamically changed
        ,defaultColor: '8CB6CE' //dynamically changed
        ,"img - edit" : ''
        ,"img - list" : 'extensions/JobSchEd/img/list.png' //Icon made by  from www.flaticon.com 
        ,"img - del"  : 'extensions/JobSchEd/img/x.png'
        ,marginSize : 20
    }

    oJobSchEd.lang = {"":""
        ,'en' : {"":""
            ,"button label" : "Edit Gantt Chart"
            ,"gantt not found"                          : "There seems to be no calendar here. Add a &lt;jsgantt autolink='0'&gt;&lt;/jsgantt&gt; tag, if you want to start."
            ,"gantt parse error - general"              : "Error parsing the gantt diagram code. This diagram is probably not a calendar."
            ,"gantt parse error - no id and name at nr" : "Error parsing code at task number %i%. This calendar is either weird or broken."
            ,"gantt parse error - at task"              : "Error parsing code at task with id %pID% (name: %pName%). This diagram is probably not a calendar or is broken."
            ,"gantt parse error - unknow activity"      : "Error! Unknow activity (name: %pRes%, color: %pColor%). This diagram is probably not a calendar or is broken."
            ,"gantt build error - at task"              : "Error building wikicode at task with id %pID% (name: %pName%).\nError: %errDesc%."
            ,"gantt add error - unknown person"         : "Error! This person was not found. Are you sure you already added this?"
            ,"header - add"         : "Add an entry"
            ,"header - edit"        : "Edit an entry"
            ,"header - persons"     : "Choose a person"
            ,"header - del"         : "Are sure you want to delete this?"
            ,"label - person"       : "Person"
            ,"label - activity"     : "Type"
            ,"label - date start"   : "Start"
            ,"label - date end"     : "End"
            ,"label - new activity" : "add an entry"
            ,"label - new person"   : "add a person"
            ,"alt - mod"            : "Change"
            ,"alt - del"            : "Delete"
            ,"close button label"   : "Close"
            ,"title - list act"     : "Show this person's entries"
            ,"title - edit"         : "Edit"
            ,"title - add"          : "Add"
            ,"title - del"          : "Delete"
            ,"activities" : [
                {name: "Time off", color:"00cc00"},
                {name: "Delegation", color:"0000cc"},
                {name: "Sickness", color:"990000"}
            ]

        }
        ,'pl' : {"":""
            ,"button label" : "Edytuj kalendarz"
            ,"gantt not found"                          : "Na tej stronie nie znaleziono kalendarza. Dodaj tag &lt;jsgantt autolink='0'&gt;&lt;/jsgantt&gt;, aby móc rozpocząć edycję."
            ,"gantt parse error - general"              : "Błąd parsowania kodu. Ten diagram prawdopodobnie nie jest kalendarzem."
            ,"gantt parse error - no id and name at nr" : "Błąd parsowania kodu przy zadaniu numer %i%. Kod diagramu jest nietypowy, albo uszkodzony."
            ,"gantt parse error - at task"              : "Błąd parsowania kodu przy zadaniu o id %pID% (nazwa: %pName%). Ten diagram nie jest kalendarzem, albo są w nim błędy."
            ,"gantt parse error - unknow activity"      : "Błąd! Nieznana aktywność (nazwa: %pRes%, kolor: %pColor%). Ten diagram nie jest kalendarzem, albo są w nim błędy."
            ,"gantt build error - at task"              : "Błąd budowania wiki-kodu przy zadaniu o id %pID% (nazwa: %pName%).\nBłąd: %errDesc%."
            ,"gantt add error - unknown person"         : "Błąd! Wybrana osoba nie została znaleziona. Czy na pewno dodałeś(-aś) ją wcześniej?"
            ,"header - add"         : "Dodaj wpis"
            ,"header - edit"        : "Edytuj wpis"
            ,"header - persons"     : "Wybierz osobę"
            ,"header - del"         : "Czy na pewno chcesz usunąć?"
            ,"label - person"       : "Osoba"
            ,"label - activity"     : "Typ"
            ,"label - date start"   : "Początek"
            ,"label - date end"     : "Koniec"
            ,"label - new activity" : "dodaj wpis"
            ,"label - new person"   : "dodaj osobę"
            ,"alt - mod"            : "Zmień"
            ,"alt - del"            : "Usuń"
            ,"close button label"   : "Zamknij"
            ,"title - list act"     : "Pokaż wpisy osoby"
            ,"title - edit"         : "Edytuj"
            ,"title - add"          : "Dodaj"
            ,"title - del"          : "Usuń"
            ,"activities" : [
                {name: "Urlop", color:"00cc00"},
                {name: "Delegacja", color:"0000cc"},
                {name: "Choroba", color:"990000"}
            ]
        }
    }


    oJobSchEd.addEdButton = function (){

        var elTB = document.getElementById('editform');
        if (!elTB)
        {
            return;
        }

        var nel = document.createElement('a');
        nel.href = "javascript:oJobSchEd.startEditor()";
        nel.style.cssText = "float:right";
        nel.appendChild(document.createTextNode(this.lang["button label"]));
        elTB.insertBefore(nel, elTB.firstChild);
    }
    // EOC@line#215
    oJobSchEd.startEditor = function ()
    {

        let strWikicode = this.getContents();
        if (strWikicode===false)
        {
            jsAlert(this.lang["gantt not found"])
        }

        if (!this.parse(strWikicode))
        {
            return;
        }

        //if (this.conf.isAutoAddLogged && typeof(mw.config.values.wgUserName)=='string' && mw.config.values.wgUserName.length)
        //{
            //if (this.firstIdOfPersonByName(mw.config.values.wgUserName)===false)
            //{
            //    this.addPerson(mw.config.values.wgUserName);
            //}
        //}

        // Main editor window: list of tasks
        this.oListAct.show();  
    }
    // EOC@line#247
    oJobSchEd.indexOfPerson = function(intPersonId)
    {
        for (var i=0; i<this.arrPersons.length; i++)
        {
            if (this.arrPersons[i] && this.arrPersons[i].intId==intPersonId)
            {
                return i;
            }
        }
        return -1;
    }
    // EOC@line#265
    oJobSchEd.firstIdOfPersonByName = function(strPersonName)
    {
        for (var i=0; i<this.arrPersons.length; i++)
        {
            if (this.arrPersons[i] && this.arrPersons[i].strName==strPersonName)
            {
                return this.arrPersons[i].intId;
            }
        }
        return false;
    }
    // EOC@line#281
    oJobSchEd.getActivityId = function(pRes, pColor)
    {
        //"activities"
        for (var i=0; i<this.lang.activities.length; i++)
        {

            if (this.lang.activities[i].name == pRes
                && (this.conf.isActivitiesIdentfiedByName || this.lang.activities[i].color == pColor)
            )
            {
                return i;
            }
        }
        return -1;
    }


    /* ------------------------------------------------------------------------ *\
            Called by oModTask.submitAdd and adds task to array
    \* ------------------------------------------------------------------------ */
    oJobSchEd.addTask = function(oTask)
    {
        this.arrTasks.push(oTask);
    }

    // EOC@line#324
    oJobSchEd.addPerson = function(strPersonName)
    {
        var intPer = this.arrPersons.length;
        var intDefaultStep = 10;

        var intPersonId = (intPer>0) ? this.arrPersons[intPer-1].intId + intDefaultStep : intDefaultStep;
        while (this.indexOfPerson (intPersonId)!=-1)
        {
            intPersonId+=10;
        }

        this.arrPersons[intPer] = {
            intId : intPersonId,
            strName : strPersonName,
            arrActivities : new Array()
        }
    }
    // EOC@line#345
    oJobSchEd.setTask = function(oTask, intPersonId, intActIndex)
    {
        var intPer = this.indexOfPerson (intPersonId);

        if (intPer==-1)
        {
            return false;
        }

        this.arrPersons[intPer].arrActivities[intActIndex] = {
            strDateStart : oTask.strDateStart,
            strDateEnd : oTask.strDateEnd,
            intId : oTask.intActivityId
        }
        return true;
    }
    // EOC@line#365
    oJobSchEd.setPerson = function(strPersonName, intPersonId)
    {
        var intPer = this.indexOfPerson (intPersonId);

        if (intPer==-1)
        {
            return false;
        }

        this.arrPersons[intPer].strName = strPersonName;
        return true;
    }

    /* ------------------------------------------------------------------------ *\
        Removes the task from the list based given it's index
    \* ------------------------------------------------------------------------ */
    //oJobSchEd.delTask = function(taskIndex){	

    //	this.arrTasks.splice(taskIndex, 1);
    //}
    // EOC@line#397
    oJobSchEd.delPerson = function(intPersonId)
    {
        var intPer = this.indexOfPerson (intPersonId);

        if (intPer==-1)
        {
            return false;
        }

        this.arrPersons[intPer] = undefined;

        this.arrPersons.myReIndexArray()
        return true;
    }
    // EOC@line#415
    Array.prototype.myReIndexArray = function ()
    {
        for (var i=0; i<this.length; i++)
        {
            if (this[i]==undefined)
            {

                for (var j=i; j<this.length; j++)
                {
                    if (this[j]==undefined)
                    {
                        continue;
                    }
                    this[i]=this[j];
                    this[j]=undefined;
                    break;
                }
            }
        }

        while (this.length > 0 && this[this.length-1] == undefined)
        {
            this.length--;
        }
    }

    /* ------------------------------------------------------------------------ *\
        Creates the form using array of objects defining fields and title	
    \* ------------------------------------------------------------------------ */
    oJobSchEd.createForm = function(arrFields, strHeader)
    {
        var strRet = ''
            + '<h2>'+strHeader+'</h2>'
            + '<div style="text-align:left; font-size:12px;" class="msgform">'
        ;
        for (var i=0; i<arrFields.length; i++)
        {
            var oF = arrFields[i];
            if (typeof(oF.value)=='undefined')
            {
                oF.value = '';
            }
            if (typeof(oF.name)=='undefined')
            {
                var now = new Date();
                oF.name = 'undefined_'+now.getTime();
            }

            /* Giving id date to the start and end fields so I can hide them if task is a group task*/
            let className  = (oF.className) ? oF.className : '';

            switch (oF.type)
            {
                default:
                case 'text':
                    var strInpId = oF.id ? oF.id : '';
                    var strExtra = '';
                    strExtra += oF.jsUpdate ? ' onchange="'+oF.jsUpdate+'" ' : '';
                    strExtra += oF.maxlen ? ' maxlength="'+oF.maxlen+'" ' : '';
                    strExtra += oF.maxlen ? ' style="width:'+(oF.maxlen*8)+'px" ' : '';
                    
                    oF.type = oF.type ? oF.type : '';                    
                    strRet += '<p class="'+ className  +'" >'
                        +'<label style="display:inline-block;width:120px;text-align:right;">'+oF.lbl+':</label>'
                        +' <input  id="'+ strInpId +'" class="'+ oF.inputClass +'" type="'+oF.type+'" name="'+oF.name+'" value="'+oF.value+'" '+strExtra+' />'
                        +'</p>'
                    ;
                break;
                case 'checkbox':
                    var strInpId = oF.name;
                    var strExtra = '';
                    var strlbl = '';
                    if(oF.lbl) strlbl = '<label for="'+strInpId+'">'+oF.lbl+':</label>';
                    strExtra += ' onclick=oJobSchEd.oModTask.toggleChecked("'+strInpId+'") ';
                    strExtra += oF.jsUpdate ? ' onchange="'+oF.jsUpdate+'" ' : '' ;
                    strExtra += oF.value ? ' checked="checked" ' : '';
                    strRet += '<p class="'+ className +'">'
                        +'<span style="display:inline-block;width:120px;text-align:right;">'+oF.title+':</span>'
                        +' <input id="'+strInpId+'" type="'+oF.type+'" name="'+oF.name+'" value="1" '+strExtra+' />'
                        +strlbl 
                        +'</p>'
                    ;

                break;
                case 'radio':
                    var dt = new Date()
                    var strInpId = oF.name+'_'+dt.getTime();
                    var strExtra = '';
                    strExtra += oF.jsUpdate ? ' onchange="'+oF.jsUpdate+'" ' : '';
                    strRet += '<p class="'+ className +'">'
                        +'<span style="display:inline-block;width:120px;text-align:right;">'+oF.title+':</span>'
                    ;
                    for (var j=0; j<oF.lbls.length; j++)
                    {
                        var oFL = oF.lbls[j];
                        var strSubInpId = strInpId+'_'+oFL.value;
                        var strSubExtra = strExtra;
                        strSubExtra += oF.value==oFL.value ? ' checked="checked" ' : '';
                        strRet += ''
                            +' <input id="'+strSubInpId+'" type="'+oF.type+'" name="'+oF.name+'" value="'+oFL.value+'" '+strSubExtra+' />'
                            +'<label for="'+strSubInpId+'">'+oFL.lbl+'</label>'
                        ;
                    }
                    strRet += '</p>';
                break;
                case 'select':
                    var dt = new Date()
                    var strInpId = oF.name+'_'+dt.getTime();
                    var strExtra = '';
                    strExtra += oF.jsUpdate ? ' onchange="'+oF.jsUpdate+'" ' : '';
                    strRet += '<p class="'+className+'">'
                        +'<span style="display:inline-block;width:120px;text-align:right;">'+oF.title+':</span>'
                        +'<select name="'+oF.name+'" '+strExtra+'>'
                    ;
                    for (var j=0; j<oF.lbls.length; j++)
                    {
                        var oFL = oF.lbls[j];
                        var strSubInpId = strInpId+'_'+oFL.value;
                        var strSubExtra ='';
                        strSubExtra += oF.value==oFL.value ? ' selected="selected" ' : '';
                        strRet += ''
                            +'<option value="'+oFL.value+'" '+strSubExtra+'>'+oFL.lbl+'</option>';
                    }
                    strRet += '</select></p>';
                break;
                case 'default_color_inputs':
                    strRet += '<p class="'+ oF.className +'" style="margin-left:20px;">'
                    + 'Save as Default: <input id="default_color" type="checkbox" onclick=oJobSchEd.oModTask.toggleChecked("default_color")>'
                    +  '<button style="margin-left:52px;" type="button" onclick="oJobSchEd.oModTask.makeDefaultColor()">Make Default!</button>';
                    + '</p>'
                    
                    
                break;
            }
        }
        
        strRet += ''
            + '</div>'
        ;
        return strRet;
    }


    oJobSchEd.parseToXMLDoc = function(strWikicode)
    {
        strWikicode = "<root>"+strWikicode+"</root>";
        var docXML;
        if (window.DOMParser)
        {
            var parser = new DOMParser();
            docXML = parser.parseFromString(strWikicode, "text/xml");
        }
        else
        {
            docXML = new ActiveXObject("Microsoft.XMLDOM");
            docXML.async = "false";
            docXML.loadXML(strWikicode);
        }
        return docXML;
    }

    oJobSchEd.parse = function(strWikicode)
    {
        let docXML = this.parseToXMLDoc(strWikicode);
        let elsTasks = docXML.getElementsByTagName('task');
        this.arrPersons = new Array();

        this.arrTasks = [];
        this.nextId = 1; 
        for (var i=0; i<elsTasks.length; i++)
        {
            var oTask = this.preParseTask(elsTasks[i]);
            if (oTask===false)
            {
                return false;
            }
            this.arrTasks.push(oTask);
        }
        
        /* Parse the preferences if any: default color */
        try{
            let prefs = docXML.getElementsByTagName('prefs')[0];
            let defColor = prefs.getElementsByTagName('defcolor')[0].textContent;
            this.conf.defaultColor = defColor
        }catch (e) {}
        
        return true;
    }

    /* ------------------------------------------------------------------------ *\
        Read in the XML of individual task nodes and build array of Tasks
    \* ------------------------------------------------------------------------ */
    oJobSchEd.preParseTask = function(nodeTask)
    {
        let oTask = new Object();
        let strDateStart, intDur, strDateEnd, strColor, strResources, intComp, boolGroup, intParent, intDepend, boolMile;

        /* Handling required fields */
        try
        {
            oTask.intId = parseInt(nodeTask.getElementsByTagName('pID')[0].textContent);
            oTask.strName = nodeTask.getElementsByTagName('pName')[0].textContent;
            
            /* Replace double with single quote otherwise it breaks the gadget sftJSmsg.js */
            oTask.strName = oTask.strName.replace(/"/g, "'");

            /* Trying to get a unique ID */
            if (oTask.intId >= oJobSchEd.nextId){
                oJobSchEd.nextId = oTask.intId+1;	
            }
        }
        catch (e)
        {
            jsAlert(this.lang["gantt parse error - no id and name at nr"].replace(/%i%/g, i));
            return false;
        }

        /* Handling optional fields*/
        try{ strDateStart = nodeTask.getElementsByTagName('pStart')[0].textContent;}catch(e){}
        finally{ if (strDateStart){ oTask.strDateStart = strDateStart;} }

        try{ strDateEnd  = nodeTask.getElementsByTagName('pEnd')[0].textContent;} catch(e){} 
        finally{if (strDateEnd){ oTask.strDateEnd = strDateEnd;}}

        try{intDur = parseInt(nodeTask.getElementsByTagName('pDur')[0].textContent);} catch(e){} 
        finally{if (intDur){ oTask.intDur= intDur;}}

        try{strColor = nodeTask.getElementsByTagName('pColor')[0].textContent;} catch(e){} 
        finally{if (strColor){ oTask.strColor = strColor;}}

        try{strResources = nodeTask.getElementsByTagName('pRes')[0].textContent;} catch(e){} 
        finally{if (strResources){ oTask.strResources= strResources;}}

        try{intComp = parseInt(nodeTask.getElementsByTagName('pComp')[0].textContent);} catch(e){} 
        finally{if (intComp){ oTask.intComp = intComp;}
                else{ oTask.intComp = 0;}}

        try{boolGroup = nodeTask.getElementsByTagName('pGroup')[0].textContent;} catch(e){}
        finally{oTask.boolGroup = (boolGroup) ? true : false;}

        try{intParent = parseInt(nodeTask.getElementsByTagName('pParent')[0].textContent);} catch(e){} 
        finally{if (intParent){ oTask.intParent= intParent;}}

        try{intDepend = parseInt(nodeTask.getElementsByTagName('pDepend')[0].textContent);} catch(e){} 
        finally{if (intDepend){ oTask.intDepend= intDepend;}}

        try{boolMile = parseInt(nodeTask.getElementsByTagName('pMile')[0].textContent);} catch(e){} 
        finally{oTask.boolMile = (boolMile) ? true : false;}

        //console.log("start: "+ strDateStart + " end: "+strDateEnd + " color: " + strColor + " resources: " + strResources + " parent: " + intParent + " pMile: " + boolMile + "intDur: "+ intDur);	
    //	catch (e){
    //		jsAlert(this.lang["gantt parse error - at task"]
    //			.replace(/%pID%/g, oTask.intId)
    //			.replace(/%pName%/g, oTask.strName)
    //		);
    //		return false;
    //	} 

        return oTask;
    }
    
    oJobSchEd.getContents = function ()
    {
       /** let request = $.ajax({
            url: mw.util.wikiScript('api'),
            type: 'get',
            data: { action:'parse', prop: 'text',page: 'Test', contentmodel: 'wikitext', format:'json' },
            dataType: 'json'
        });
        
        // Callback handler that will be called on success
        request.done(function (response, textStatus, jqXHR){
            console.log("Hooray, it worked!");
            console.log(response);
        });
        
        // Callback handler that will be called on failure
        request.fail(function (jqXHR, textStatus, errorThrown){
            // Log the error to the console
            console.error(
                "The following error occurred: "+
                textStatus, errorThrown
            );
        }); */
        
        //this.elEditArea = document.getElementById('wpTextbox1');
        this.elEditArea = document.getElementById('wpTextbox1');
        let el = this.elEditArea;
        let m = el.value.match(this.conf.reGantMatch);
        if (m)
        {
            return m[2];
        }
        return false;
    }

    oJobSchEd.setContents = function(strWikicode)
    {
        var el = this.elEditArea;
        el.value = el.value.replace(this.conf.reGantMatch, "$1"+strWikicode+"$3");
    }

    /* ------------------------------------------------------------------------ *\
        Build the jsGantt XML code by looping through all tasks
    \* ------------------------------------------------------------------------ */
    oJobSchEd.buildWikicode = function ()
    {
        let strWikicode = '';

        for (var i=0; i<this.arrTasks.length; i++){
            strWikicode += this.buildTaskcode(this.arrTasks[i]);
        }
        
        //Add an XML tag for default color preferences
        strWikicode += '\n'
                     + '<prefs>\n'
                         + '\t<defcolor>' + oJobSchEd.conf.defaultColor + '</defcolor>\n'
                     + '</prefs>\n';

        return strWikicode;
    }

    /* ------------------------------------------------------------------------ *\
        Build the jsGantt XML code a task
    \* ------------------------------------------------------------------------ */
    oJobSchEd.buildTaskcode = function(oTask)
    {
        let strWikiCode = '';

        let pName = (oTask.strName) 	? '\n\t<pName>'+this.encodeHTML(oTask.strName)+'</pName>' : '';
        let pDateStart = (oTask.strDateStart) 	? '\n\t<pStart>'+oTask.strDateStart+'</pStart>' : '';
        let pDateEnd = (oTask.strDateEnd) 	? '\n\t<pEnd>'+oTask.strDateEnd+'</pEnd>' : '';
        let pDur = (oTask.intDur)		? '\n\t<pDur>'+oTask.intDur+'</pDur>' : '';
        let pRes =  (oTask.strResources) 	? '\n\t<pRes>'+this.encodeHTML(oTask.strResources)+'</pRes>' : '';
        let pComp = (oTask.intComp !== null) 		? '\n\t<pComp>'+oTask.intComp+'</pComp>' : '';	
        let pGroup = (oTask.boolGroup) 		? '\n\t<pGroup>1</pGroup>' : '';	
        let pParent = (oTask.intParent) 	? '\n\t<pParent>'+oTask.intParent+'</pParent>' : '';
        let pDepend = (oTask.intDepend) 	? '\n\t<pDepend>'+oTask.intDepend+'</pDepend>' : '';
        let pMile = (oTask.boolMile)		? '\n\t<pMile>1</pMile>' : '';	
        
        try
        {
            strWikiCode = '\n<task>'
                +'\n\t<pID>'+oTask.intId+'</pID>'
                + pName
                +'\n\t<pColor>'+oTask.strColor+'</pColor>'
                + pDateStart
                + pDateEnd
                + pRes
                + pComp
                + pGroup
                + pParent
                + pDepend
                + pMile
                + pDur
                +'\n</task>'
            ;
        }
        //TODO FIX the error
        catch (e)
        {
            jsAlert(this.lang["gantt build error - at task"]
                .replace(/%pID%/g, oTask.intId)
                .replace(/%pName%/g, oTask.strName)
                .replace(/%errDesc%/g, e.description)
            );
            return '';
        }

        return strWikiCode;
    }









/***************************************************************************************************************************/


    oJobSchEd.oModPerson = new Object();

    oJobSchEd.oModPerson.showAdd = function ()
    {
        this.oParent.oNewPerson = {
            strPersonName : ''
        };


        var arrFields = this.getArrFields('oJobSchEd.oNewPerson');
        var strHTML = this.oParent.createForm(arrFields, this.oParent.lang['header - add']);


        var msg = this.oMsg;
        msg.show(strHTML, 'oJobSchEd.oModPerson.submitAdd()');
        msg.repositionMsgCenter();
    }

    oJobSchEd.oModPerson.submitAdd = function ()
    {
        this.oParent.addPerson(this.oParent.oNewPerson.strPersonName);

        this.submitCommon();
    }

    oJobSchEd.oModPerson.showEdit = function(intPersonId)
    {

        var intPer = this.oParent.indexOfPerson(intPersonId);
        this.oParent.oNewPerson = {
            strPersonName : this.oParent.arrPersons[intPer].strName
        };


        var arrFields = this.getArrFields('oJobSchEd.oNewPerson');
        var strHTML = this.oParent.createForm(arrFields, this.oParent.lang['header - edit']);


        var msg = this.oMsg;
        msg.show(strHTML, 'oJobSchEd.oModPerson.submitEdit('+intPersonId+')');
        msg.repositionMsgCenter();
    }

    oJobSchEd.oModPerson.submitEdit = function(intPersonId)
    {

        this.oParent.setPerson (this.oParent.oNewPerson.strPersonName, intPersonId);


        this.submitCommon();
    }

    oJobSchEd.oModPerson.showDel = function(intPersonId)
    {

        var intPer = this.oParent.indexOfPerson(intPersonId);


        var strHTML = "<h2>"+this.oParent.lang['header - del']+"</h2>"
            + this.oParent.arrPersons[intPer].strName;


        var msg = this.oMsg;
        msg.show(strHTML, 'oJobSchEd.oModPerson.submitDel('+intPersonId+')');
        msg.repositionMsgCenter();
    }
    // EOC@line#99
    oJobSchEd.oModPerson.submitDel = function(intPersonId)
    {

        this.oParent.delPerson (intPersonId);


        this.submitCommon();
    }
    // EOC@line#138
    oJobSchEd.oModPerson.getArrFields = function(strNewPersonObject)
    {
        return [
            {type:'text', maxlen: 10, lbl: this.oParent.lang['label - person']
                , value:this.oParent.oNewPerson.strPersonName
                , jsUpdate:strNewPersonObject+'.strPersonName = this.value'}
        ];
    }
    // EOC@line#150
    oJobSchEd.oModPerson.submitCommon = function ()
    {

        var strWikicode = this.oParent.buildWikicode();

        this.oParent.setContents(strWikicode);

        this.oMsg.close();


        this.oParent.oListPersons.refresh();
    }
    // msgs_mod_p, EOF
    // msgs_mod_t, line#0


/***************************************************************************************************************************/


















    /* ------------------------------------------------------------------------ *\
        Modify task object used to modify any task  	
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask = new Object();


    /* ------------------------------------------------------------------------ *\
        Display new task template	
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.showAdd = function(intTaskId)
    {
        this.buildLabels();
        let oP = this.oParent;
        //Increment id
        oP.nextId++;

        let now = new Date();
        oP.oNewTask = {
            intId : intTaskId,
            strName : '',
            strDateStart : now.dateFormat(this.oParent.conf.strFormat),
            strDateEnd : now.dateFormat(this.oParent.conf.strFormat),
            strColor : oP.conf.defaultColor,
            strResources : '',
            intComp : 0,
            boolGroup : false,
            intParent : null, 
            intDepend : null,
            boolMile : false, 
            intDur: 1
        };

        var arrFields = this.getArrFields('oJobSchEd.oNewTask');
        var strHTML = this.oParent.createForm(arrFields, this.oParent.lang['header - add']);

        var msg = this.oMsg;
        msg.show(strHTML, 'oJobSchEd.oModTask.submitAdd()');
        msg.repositionMsgCenter();
        $(document).ready(function() {
            jscolor.installByClassName("jscolor");
        });
        
    }

    /* ------------------------------------------------------------------------ *\
        Append the task to the list, submit and refresh 	
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.submitAdd = function ()
    {

        let oP = this.oParent;
        if (!(this.preSubmitTask(oP))){
            return;
        }

        /* Add in new task */
        this.insertTask(null, null);
        oP.oNewTask = null;

        this.submitCommon();
    }

    /* ------------------------------------------------------------------------ *\
        Gets the object and displays a form to edit it 	
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.showEdit = function(taskId){

        this.buildLabels();
        let i;
        for (i=0; i<this.oParent.arrTasks.length; i++){
            let oA = this.oParent.arrTasks[i];

            if (oA.intId === taskId){
                this.oParent.oNewTask = {
                    intId 			: oA.intId,
                    strName 		: oA.strName,
                    strDateStart 	: oA.strDateStart,
                    strDateEnd 		: oA.strDateEnd,
                    intDur 			: oA.intDur,
                    strColor 		: oA.strColor,
                    strResources 	: oA.strResources,
                    intComp 		: oA.intComp,
                    boolGroup 		: oA.boolGroup,
                    intParent 		: oA.intParent, 
                    intDepend 		: oA.intDepend,
                    boolMile 		: oA.boolMile
                };
                break;
            }
        }
        
        //DEBUG
        //console.log('old')
        //console.log(oJobSchEd.oNewTask)
        
        let arrFields = this.getArrFields('oJobSchEd.oNewTask');
        let strHTML = this.oParent.createForm(arrFields, this.oParent.lang['header - edit']);
            

        let msg = this.oMsg;
        this.oParent.oNewTask.intParent = (this.oParent.oNewTask.intParent) ? this.oParent.oNewTask.intParent : null;
        msg.saveBtnFunction = 'oJobSchEd.oModTask.saveBtnFunction('+i+', '+ this.oParent.oNewTask.intParent+')';
        msg.show(strHTML, 'oJobSchEd.oModTask.submitEdit('+i+', '+ this.oParent.oNewTask.intParent+')');
        msg.repositionMsgCenter();

        /* If group is checked then hide the related fields */
        if (this.oParent.oNewTask.boolGroup){
            let related_fields = document.getElementsByClassName("toggle_visibility_group");
            let i;
            for(i = 0; i < related_fields.length; i++){
                related_fields[i].style.display = "none";
            }
        }
        /* If group is checked then hide the related fields */
        if (this.oParent.oNewTask.boolMile){
            let related_fields = document.getElementsByClassName("toggle_visibility_mile");
            let i;
            for(i = 0; i < related_fields.length; i++){
                related_fields[i].style.display = "none";
            }
        }
        $(document).ready(function() {
            jscolor.installByClassName("jscolor");
        });
        
    }

    /* ------------------------------------------------------------------------ *\
        Assigns the new task object in the array at the specified index		
    \* ------------------------------------------------------------------------ */

    oJobSchEd.oModTask.submitEdit = function(taskIndex, intParentOld){

        let oP = this.oParent;
        if (!(this.preSubmitTask(oP))){
            return;
        }

        /* Removing the old task */
        oP.arrTasks.splice(taskIndex, 1);

        /* Add in edited task */
        let movingChildrenInfo = this.insertTask(taskIndex, intParentOld);
        
        /* Move all its children with it*/
        if (movingChildrenInfo) {
            this.moveChildren(movingChildrenInfo.startIndex, movingChildrenInfo.endIndex, movingChildrenInfo.parentNewIndex);
        }
        
        oP.oNewTask = null;

        this.submitCommon();
    }

    /* ------------------------------------------------------------------------ *\
        Pre configure before submiting a task  	
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.preSubmitTask = function(oP){
        let task = oP.oNewTask;
        /*Debug*/
        //console.log("New task:");
        //console.log(oP.oNewTask);

        /* Parse all integers */    
        task.intComp = (!isNaN(task.intComp) && (task.intComp != null)) ? (parseInt(task.intComp))              : NaN;
        task.intParent = (!isNaN(task.intParent) && (task.intParent != null)) ? (parseInt(task.intParent))      : NaN;
        task.intDepend = (!isNaN(task.intDepend) && (task.intDepend != null)) ? (parseInt(task.intDepend))      : NaN;
        task.intDur = (!isNaN(task.intDur) && (task.intDur != null)) ? (parseInt(task.intDur))                  : NaN;
        
        /* Check for empty string for name */
        if (!task.strName) {
            jsAlert("Task must have a name!");
            return false;
        }
        /* Check date format */
        else if ((!this.isDateFormatCorrect(task.strDateStart)) && (!task.boolGroup)) {
            jsAlert("Please enter the date in 'YYYY-MM-DD' format and make sure it's within bounds");
            return false;
        }
        /* Check duration */
        else if ((isNaN(task.intDur) || task.intDur < 1) && (!task.boolMile && !task.boolGroup)) {
            jsAlert("Duration must be a positive integer");
            return false;
        }
        /* Check for % complete*/
        else if ((isNaN(task.intComp) || task.intComp < 0) && (!task.boolMile && !task.boolGroup)) {
            jsAlert("Percent Complete must be a non-negative integer");
            return false;
        }

        /* Check for hidden fields and set values accordingly */
        if (task.boolGroup){
            task.strDateStart    = null;
            task.strDateEnd      = null;
            task.intDur          = null;
            task.intComp         = null;
            task.intColor        = null;
        }

        /* Check for hidden fields and set values accordingly */
        if (task.boolMile){
            task.strDateEnd      = task.strDateStart;
            task.intDur          = 1;
            task.strResources    = null;
            task.boolGroup       = null;
            task.intColor        = null;
        }
        
        /* Deal with parents */
        task.intParent = (task.intParent) ? task.intParent : null;
        
        /* If set default color was checked then change the default color, and uncheck it in conf */
        if (oJobSchEd.conf.defaultChecked) {
            oJobSchEd.conf.defaultColor = oJobSchEd.conf.currentColor;
        }
        oJobSchEd.conf.defaultChecked = false;
        
        /* Calculate and set end date if start date and duration is available */
        if (task.strDateStart && (task.intDur > 0 )){
            task.strDateEnd = this.addBusinessDays(task.strDateStart, (task.intDur-1));	
        }
        else if(task.boolGroup === false && task.boolMile === false){
            jsAlert("\"Number of days\" must be a positive integer greater than 0");
            task = null;
            return false;
        }
        
        task = null;
        return true;
    }
    
    /* ------------------------------------------------------------------------ *\
          	
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.saveBtnFunction = function(taskIndex, intParentOld){
        
        // Submit the task
        this.submitEdit(taskIndex, intParentOld);
        
        // Submit the media wiki form
        $("#editform").submit();
        
        //Close forms
        this.oParent.oListAct.oMsg.close();
        
        //Add semi-transparent overlay while page loads
        this.oParent.createOverlay();
    
    
    }
    
    /* ------------------------------------------------------------------------ *\
        When user clicks on delete task button  	
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.showDel = function(taskId){

        let strHTML, i;
        for (i=0; i<this.oParent.arrTasks.length; i++){
            let oA = this.oParent.arrTasks[i];

            if (oA.intId === taskId){

                strHTML = "<h2>"+this.oParent.lang['header - del']+"</h2>"
                    +oA.strName
                    +": "+oA.strDateStart+" - "+oA.strDateEnd;	
                break;
            }
        }

        let msg = this.oMsg;
        msg.show(strHTML, 'oJobSchEd.oModTask.submitDel('+i+')');
        msg.repositionMsgCenter();
    }


    /* ------------------------------------------------------------------------ *\
        Uses the index of a task object and removes it from the array  	
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.submitDel = function(taskIndex){

        this.oParent.arrTasks.splice(taskIndex, 1);
        //this.oParent.delTask(taskIndex);

        this.submitCommon();
    }

    /* ------------------------------------------------------------------------ *\
        Builds 2 arrays {label,value} objects of all tasks and only groups
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.buildLabels = function ()
    {
        this.arrTaskLblsGroup = new Array();
        this.arrTaskLbls = new Array();

        /* Adding an option for none */
        let none_option = {
            value	: null,
            lbl	:  "None"	
        };

        this.arrTaskLblsGroup.push(none_option);	
        this.arrTaskLbls.push(none_option);	

        let i;
        for (i=0; i<this.oParent.arrTasks.length; i++)
        {
            /* Only use tasks that are grouping tasks */
            if(this.oParent.arrTasks[i].boolGroup){
                this.arrTaskLblsGroup.push({
                    value	: this.oParent.arrTasks[i].intId,
                    lbl	    : this.oParent.arrTasks[i].strName
                });
            }
            /* Second array containing all tasks */
            this.arrTaskLbls.push({
                value	: this.oParent.arrTasks[i].intId,
                lbl	    : this.oParent.arrTasks[i].strName
            });
        }
    }

    /* ------------------------------------------------------------------------ *\
        Making the task template form 	
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.getArrFields = function(strNewTaskObject)
    {
        let checkboxValueGroup, checkboxValueMilestone;
        checkboxValueGroup = (this.oParent.oNewTask.boolGroup) ? "checked" : '';
        checkboxValueMilestone = (this.oParent.oNewTask.boolMile) ? "checked" : '';

        return [
            {type:'text',  lbl: 'Title' 
                , value: this.oParent.oNewTask.strName 
                , jsUpdate:strNewTaskObject+'.strName = this.value' },

            {type:'text', maxlen: 10, lbl: 'Start'
                , value: this.oParent.oNewTask.strDateStart
                , jsUpdate:strNewTaskObject+'.strDateStart = this.value'
                , className: "toggle_visibility_group" },

            {type:'text', maxlen: 4, lbl: 'Number of days'
                , value: this.oParent.oNewTask.intDur
                , jsUpdate:strNewTaskObject+'.intDur = this.value'
                , className: "toggle_visibility_group toggle_visibility_mile" },

            {type:'text', lbl: 'Resources'
                , value: this.oParent.oNewTask.strResources 
                , jsUpdate:strNewTaskObject+'.strResources = this.value'
                , className: "toggle_visibility_mile" },

            {type: 'text', maxlen: 3, lbl: 'Complete(%)'
                , value: this.oParent.oNewTask.intComp
                , jsUpdate:strNewTaskObject+'.intComp = this.value' 
                , className: "toggle_visibility_group" },

            {type: 'checkbox', title: 'Group object', name:'group'
                , value: checkboxValueGroup
                , className: "toggle_visibility_mile" },

            {type: 'select', title: 'Parent', lbls: this.arrTaskLblsGroup
                , value: this.oParent.oNewTask.intParent
                , jsUpdate:strNewTaskObject+'.intParent = this.value' },

            {type: 'select', title: 'Depends on', lbls: this.arrTaskLbls
                , value: this.oParent.oNewTask.intDepend
                , jsUpdate:strNewTaskObject+'.intDepend = this.value' },

            {type: 'checkbox', title: 'Milestone', name:'milestone'
                , className: "toggle_visibility_group"
                , value: checkboxValueMilestone },
            
            {type: 'text', lbl: 'Color'
                , value: this.oParent.oNewTask.strColor
                , jsUpdate:strNewTaskObject+'.strColor = this.value'
                , className: "input_color toggle_visibility_group toggle_visibility_mile"
                , inputClass: "jscolor"
                , id: "input_color"},
            
            {type: 'default_color_inputs'
                , className: "toggle_visibility_group toggle_visibility_mile" }
        ];
        
    }

    /* ------------------------------------------------------------------------ *\
        Builds XML code, sets it in the wiki and refreshes all tasks  	
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.submitCommon = function ()
    {

        var strWikicode = this.oParent.buildWikicode();

        this.oParent.setContents(strWikicode);

        this.oMsg.close();



        this.oParent.oListAct.refresh();
    }
    
    /* ------------------------------------------------------------------------ *\
        Checks date field format YYYY-MM-DD
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.isDateFormatCorrect = function(date){
        let re = /^(19|20|21)\d{2}-(0[1-9]|1[0-2])-(0[1-9]|1\d|2\d|3[01])/;
        if (re.test(date)) {
            return true;
        }
        return false;
    }

    /* ------------------------------------------------------------------------ *\
        Updates group/milestone of oNewTask and set visibility of fields
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.toggleChecked = function(id){

        let checked = document.getElementById(id).checked;
        if (id === "group"){
            this.oParent.oNewTask.boolGroup = checked;
            this.updateFieldsVisibility("toggle_visibility_group", checked);
        }
        else if (id === "milestone"){
            this.oParent.oNewTask.boolMile = checked;
            this.updateFieldsVisibility("toggle_visibility_mile", checked);
        }
        else if (id === "default_color") {
            if (checked) {
                oJobSchEd.conf.currentColor = $("#input_color")[0].value;
                oJobSchEd.conf.defaultChecked = true;
            }
            else {
                oJobSchEd.conf.defaultChecked = false;
            }
        }

    }
    
    /* ------------------------------------------------------------------------ *\
        Helper function deals with setting display of related fields
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.updateFieldsVisibility = function(className, checked){

        /* Toggle visibility for related fields of group task */
        let related_fields = document.getElementsByClassName(className);

        if (checked){
            let i;
            for(i = 0; i < related_fields.length; i++){
                related_fields[i].style.display = "none";
            }
        }
        else {
            let i;
            for(i = 0; i < related_fields.length; i++){
                related_fields[i].style.display = "block";
            }
            /* If we just unchecked milestone and group is still checked */
            if (className === "toggle_visibility_mile" && document.getElementById("group").checked){
                let related_fields_group = document.getElementsByClassName("toggle_visibility_group");
                let i;
                for(i = 0; i < related_fields_group.length; i++){
                    related_fields_group[i].style.display = "none";
                }
            }
        }

    }

    /* ------------------------------------------------------------------------ *\
        Calculates end date given a start daye and duration	
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.addBusinessDays = function(startDate, days){
        let newDate = new Date(startDate);
        let moment_instance = new moment(startDate, "YYYY-MM-DD");
        let endDate = moment_instance.businessAdd(days)._d;	
        let endDateString = ((endDate.getYear()+1900) + "-" + (endDate.getMonth()+1) + "-" + endDate.getDate());
        return endDateString;	
    }

    /* ------------------------------------------------------------------------------------- *\
        Algorithm that finds the proper spot for task in already sorted array and inserts it
        It also accounts for when a  parent task changes then all of it's kids must follow
    \* ------------------------------------------------------------------------------------- */
    oJobSchEd.oModTask.insertTask = function (taskIndex, intParentOld){                      // intParentOld may be null             //@TODO: only move tasks if parent changes 
        let oP = this.oParent;
        let oNewTask = oP.oNewTask;
        let len = oP.arrTasks.length;
        let i = 0;
        let stack = []; // Stack is used to keep track of the parent of task i and it's grad-parent(s)
        let task_prev, task_curr, task_next;
        
        /* If array is empty or task didn't change parents */
        if(oP.arrTasks.length === 0 || oNewTask.intParent === intParentOld){
            if(!(isNaN(taskIndex)) && taskIndex != null) {
                oP.arrTasks.splice(taskIndex, 0, oNewTask);
            }
            else{
                oP.arrTasks.push(oNewTask);
            }
            oP.stack = null;
            return null;
        }
        
        let lastChild = this.getLastChild(taskIndex, oNewTask.intId);
        console.log(lastChild);
        
        /* Array is atleast 1 item long and new task has a parent*/
        /* Iterate through the tasks  */
        while (i < len) {
            
            task_prev = oP.arrTasks[i-1];
            task_curr = oP.arrTasks[i];
            task_next = oP.arrTasks[i+1];
            
            /* If it's the last task OR (previous task is not the parent) */
            if (!(task_next) || ((task_prev && task_prev.intId != task_curr.intParent)) ) { 
                
                /* Keep removing from stack until either (the last element is the parent of current task or stack is empty) */
                while (stack.last() != task_curr.intParent) {                                        
                    let item = stack.pop();
                    
                    /* If we are finished with the subtasks for the desired parent then insert here */
                    if (item === oNewTask.intParent) {
                        oP.arrTasks.splice(i, 0, oNewTask);
                        
                        if (i <= lastChild) {
                            lastChild++;    
                        }
                        
                        if (i <= taskIndex) {
                            taskIndex++;
                        }
                        
                        return {startIndex: taskIndex, endIndex: lastChild, parentNewIndex: i};
                    }
                    
                    /* If stack is empty then desired parent wasn't in there and we can move on */
                    if (stack.length === 0) {
                        break;
                    }
                }
                if (!(task_next)) {
                    oP.arrTasks.push(oNewTask);
                    return {startIndex: taskIndex, endIndex: lastChild, parentNewIndex: oP.arrTasks.length};
                }
            }
            
            /* If grouping task then add to stack */
            if (task_curr.boolGroup) {
                stack.push(task_curr.intId);
            }

            i++;
        }
    }

    /* ------------------------------------------------------------------------ *\
        Returns the last child index for a task
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.getLastChild = function(whereTaskWas, parentId) {
        let oP = this.oParent;
        let oNewTask = oP.oNewTask;
        let len = oP.arrTasks.length;
        let i = whereTaskWas;
        let stack = [parentId]; // Stack is used to keep track of the parent of task i and it's grand-parent(s)
        let task_prev, task_curr, task_next;
        
        if (whereTaskWas >= len || !oP.arrTasks[whereTaskWas] || oP.arrTasks[whereTaskWas].intParent !== parentId) {
            return null;
        }
        
        /* Array is atleast 1 item long and new task has a parent*/
        while (i < len) {
            
            task_prev = oP.arrTasks[i-1];
            task_curr = oP.arrTasks[i];
            task_next = oP.arrTasks[i+1];
            
            /* If it's the last task OR (previous task is not the parent) */
            if (!(task_next)  ||  ((task_prev && task_prev.intId != task_curr.intParent)) ) { 
                
                /* Keep removing from stack until either (the last element is the parent of current task or stack is empty) */
                while (stack.last() != task_curr.intParent) {                                        
                    let item = stack.pop();
                    
                    /* If we are finished with the subtasks for the desired parent then insert here */
                    if (item === parentId) {
                        if (oP.arrTasks[i-1].intId !== parentId) {
                            return i-1;
                        }
                        return null;
                    }
                    
                    /* If stack is empty then desired parent wasn't in there and we can move on */
                    if (stack.length === 0) {
                        break;
                    }
                }
                if (!(task_next)) {
                    return i;
                }
            }
            
            /* If grouping task then add to stack */
            if (task_curr.boolGroup) {
                stack.push(task_curr.intId);
            }

            i++;
        }
        return null;
    }
    
    /* ------------------------------------------------------------------------ *\
        Moves the children to where the parent moved
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.moveChildren = function(startingAt, EndingAt, parentIndex) {
        let oP = this.oParent;
        let arr = oP.arrTasks;
        let diff = EndingAt - startingAt;
        let i = 0;
        
        let children = arr.splice(startingAt, diff+1);
        console.log(children)
        
        if (parentIndex > startingAt) {
            parentIndex-=(diff+1);    
        }
        arr.splice(parentIndex+1, 0, children)  // since children is also an array we need to flatten the tasks array
        arr = arr.reduce(function(a,b) {
                            return a.concat(b);           
                        }, []);
        oP.arrTasks = arr;        
    }
    
    /* ------------------------------------------------------------------------ *\
        Changes the value of color field to default on button press
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oModTask.makeDefaultColor = function() {
        $("#input_color")[0].value = oJobSchEd.conf.defaultColor;
        $("#input_color")[0].jscolor.fromString($("#input_color")[0].value)         // update the color immediately
        oJobSchEd.oNewTask.strColor = $("#input_color")[0].value; 
    }
    
    
    /* ------------------------------------------------------------------------ *\
        Escapes the strings with proper sequences
    \* ------------------------------------------------------------------------ */
    oJobSchEd.encodeHTML = function (st) {
            if (st) {
                return st.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&apos;')
               .replace(/'/g, '&apos;');
            }
            else {
                return ''
            }
    };
    







    /* ------------------------------------------------------------------------ *\
          List Activities object that is used to show tasks
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oListAct = {}


    /* ------------------------------------------------------------------------ *\
         Displays the list of tasks with options to edit or delete
    \* ------------------------------------------------------------------------ */

    oJobSchEd.oListAct.show = function () {
        let indentLevel = 0;
        let listStyletype = 'inherit';
        let stack = [];
        let i = 0;
        
        let oP = this.oParent;
        let strList = '<h2>'+ 'Tasks' +'</h2>';
        strList += '<ul style="text-align:left">';

        while (i<oP.arrTasks.length) {
            
            task_prev = oP.arrTasks[i-1];
            task_curr = oP.arrTasks[i];
            task_next = oP.arrTasks[i+1];
            
            if (typeof(task_curr)=='undefined'){
                continue;
            }

            /* If it's not a sub child then decrement indetation until parent is found */
            if (task_prev && task_prev.intId != task_curr.intParent) { 
                /* Increase indent level and reassign prev parent to current one */
                while (stack.last() != task_curr.intParent){
                    //debugger;
                    let parentFromStack = stack.pop();

                    indentLevel--;
                    
                    if (stack.length === 0) {
                        indentLevel = 0;
                        listStyletype = 'inherit';
                        break;
                    }
                }
            }
            else if (task_curr.intParent) {
                indentLevel++;
            }
            if (task_next && task_next.intParent === task_curr.intId){
                stack.push(task_curr.intId);
            }
            if (typeof(task_curr.intParent) === "number" ) {
                listStyletype = 'none';
            }    

            strList += ''
                +'<li style="margin-left:'+ indentLevel * oP.conf.marginSize +'px; list-style:'+ listStyletype +'";>'
                    +'<a href="javascript:oJobSchEd.oModTask.showEdit('+task_curr.intId.toString()+')" title="'
                            +this.oParent.lang["title - edit"]
                        +'">'
                        +task_curr.strName
                    +'</a>'
                    +' '
                    +'<a href="javascript:oJobSchEd.oModTask.showDel('+task_curr.intId.toString()+')" title="'
                            +this.oParent.lang["title - del"]
                        +'">'
                        +'<img src="'+this.oParent.conf['img - del']+'" alt="" />'
                    +'</a>'
                +'</li>';
            
            i++;
        }
        strList += ''
            +'<li>'
                +'<a href="javascript:oJobSchEd.oModTask.showAdd('+oP.nextId.toString()+')" title="'
                            +this.oParent.lang["title - add"]
                        +'">'
                    +this.oParent.lang['label - new activity']
                +'</a>'
            +'</li>';
        strList += '</ul>';


        var msg = this.oMsg;
        msg.show(strList);
        msg.repositionMsgCenter();
    }


    /* ------------------------------------------------------------------------ *\
        Refresh task list 	
    \* ------------------------------------------------------------------------ */
    oJobSchEd.oListAct.refresh = function ()
    {
        this.oMsg.close();

        this.show();
    }



    /* ------------------------------------------------------------------------ *\
        Greys out page so user doesn't try to interact with it 	
    \* ------------------------------------------------------------------------ */
    oJobSchEd.createOverlay = function () {
        let overlay = document.createElement('div');
        overlay.style.backgroundColor = '#e9e9e9';
        //overlay.style.display = 'none';
        overlay.style.position = 'absolute';
        overlay.style.top = 0;
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.opacity = '.7';
        document.body.appendChild(overlay);
    }






    /* ------------------------------------------------------------------------ *\
        INIT 	
    \* ------------------------------------------------------------------------ */
    oJobSchEd.init = function (openTask)
    {
        if (this.conf.strLang in this.lang)
        {
            this.lang = this.lang[this.conf.strLang]
        }
        else
        {
            this.lang = this.lang[this.conf.strFallbackLang]
        }

        // Edit button
        this.addEdButton();

        // Task form
        var msg = new sftJSmsg();
        msg.repositionMsgCenter();
        msg.styleWidth = 1000;
        msg.styleZbase += 30;
        msg.showCancel = true;
        msg.showSave = true;
        msg.autoOKClose = false;
        msg.createRegularForm = false;
        this.oModTask.oMsg = msg;
        this.oModTask.oParent = this;

        // Tasks List
        var msg = new sftJSmsg();
        msg.repositionMsgCenter();
        msg.styleWidth = 1000;
        msg.styleZbase += 20;
        msg.showCancel = false;
        msg.lang['OK'] = this.lang["close button label"];
        msg.createRegularForm = false;
        this.oListAct.oMsg = msg;
        this.oListAct.oParent = this;

        // Autoedit
        
        if (location.href.search(/[&?]jsganttautoedit=1/)>=0){
            this.startEditor();
        }

        // If the task was clicked on the Gantt chart
        if (openTask) {
            this.startEditor();
            
            // Find the task requested
            let i = 0, taskRequested;
            for (i; i < this.arrTasks.length; i++) {
                let iTaskName = this.arrTasks[i].strName;
                iTaskName = iTaskName.replace(/"/g, '');
                openTask = openTask.replace(/%27/g, "'")
                openTask = openTask.replace(/%3C/g, "<")
                openTask = openTask.replace(/%3E/g, ">")
                if (iTaskName === openTask){
                    taskRequested = this.arrTasks[i];
                    break;
                }
            }
            
            // if found then display it
            if (taskRequested) {
                this.oModTask.showEdit(taskRequested.intId);
            }
            else {
                alert("Task not found...");
            }
        }
    }

    /* ------------------------------------------------------------------------ *\
        Start	
    \* ------------------------------------------------------------------------ */
    if (window.location.href.indexOf('openTask') > -1) {
        let taskName = window.location.href.split('openTask=')[1];
        window.history.replaceState({}, "", window.location.href.split('#openTask=')[0]);
        openTask = taskName.replace(/\+/g, ' ');
        //console.log('Open this task: ' + openTask);
        addOnloadHook(function () {oJobSchEd.init()});
        oJobSchEd.init(openTask);
    }
    
    else if (mw.config.values.wgAction=="edit" || mw.config.values.wgAction=="submit") {
    	addOnloadHook(function () {oJobSchEd.init()});
        oJobSchEd.init();
    }










};
