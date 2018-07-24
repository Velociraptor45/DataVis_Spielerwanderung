var d3 = d3 || {};

(function(){
    "use strict";

    let svgID = "#sankey";
    let nodesID = "#nodes";
    let transferValueID = "#transferValue";
    let selectedTeamID = "#selected";
    let linkToClassName = "linkTo";
    let linkFromClassName = "linkFr";
    let emphasizeTo = "linkToEmphasize";
    let emphasizeFrom = "linkFrEmphasize";
    
    let svgWidth = 500;
    let svgHeight;

    let firstDiv = "SV Werder Bremen,Borussia Dortmund,FC Bayern München,Borussia Mönchengladbach,Bayer 04 Leverkusen,TSG 1899 Hoffenheim,Eintracht Frankfurt,RB Leipzig,VfB Stuttgart,VfL Wolfsburg,Hannover 96,Hertha BSC,1.FSV Mainz 05,Hamburger SV,1.FC Köln,FC Augsburg,FC Schalke 04,SC Freiburg".split(",");
    let otherGerDiv = "Karlsruher SC,SC Paderborn,VfL Bochum,1860 München,Carl Zeiss Jena,1.FC Nürnberg,Stuttgart II,Wehen Wiesbaden,Hansa Rostock,B. München II,Waldh. Mannheim,Jahn Regensburg,Erzgebirge Aue,E. Frankfurt II,Alem. Aachen,Arminia Bielefeld,Roter Stern,Kickers Emden,MSV Duisburg,Energie Cottbus,SpVgg Neckarelz,VfL Bochum II,Rot Weiss Ahlen,Dynamo Dresden,B. Dortmund II,W. Bremen II,1.FC Heidenheim,VfR Aalen,FC Ingolstadt 04,SV Darmstadt 98,Wolfsburg II,Schwabmünchen,1.FC Kaiserslautern,SC Fortuna Köln,Würzb. Kickers,Eintracht Braunschweig,TuS Haltern,RW Darmstadt,TS Ober-Roden,Rot-Weiß Erfurt,FSV Mainz 05 II,VfB Ginsheim,SV Elversberg,W. Nordhausen,Hannover 96 II,Fortuna Düsseldorf,SC Freiburg II,Schalke 04 II,Viktoria Köln,Preußen Münster,K'lautern II,FSV Erlangen-B.,K. Offenbach,Stuttg. Kickers,Union Berlin,VfL Osnabrück,FC St. Pauli,TSV Neusäß,TSV Gersthofen,TSV Aindling,Saarbrücken,RW Oberhausen,FSV Frankfurt,Eintracht Frankfurt,Holstein Kiel,1.FC Magdeburg,Unterhaching,Chemnitzer FC,Nürnberg II,SV Sandhausen,Hoffenheim II,Hertha BSC II,SpVgg Greuther Fürth,M'gladbach II".split(",");
    let youth = "K'lautern U19,B. Dortmund U19,A. Aachen U19,VfL Bochum U19,Mainz 05 U19,Hertha BSC U19,Schalke 04 U19,M'gladbach U19,1.FC Köln U19,TSV 1860 U19,Wolfsburg U19,Hamburg U19,Stuttgart U19,B. München U19,Karlsruhe U19,Frankfurt U19,Leverkusen U19".split(",");

    let allGraphs = {"graphs": []};
    let graph;

    let graphSizes = [1300, 1300, 900, 1100, 1600, 1600, 1200, 600, 1300, 1300, 1300, 1300, 1300, 1300, 1100, 1300, 1300, 1700];

    let selectedTeam;

    let $currentlyClickedLink = undefined;

    function start(){
        makeTeamSelection(firstDiv);
        loadJSON();
    }

    function loadJSON(){
        d3.json("JSON/player_movement.json").then(function(data){
            buildGraphs(data);
            replaceTextWithIndex();
        });
    }

    /**
     * removes everything inside the svg
     */
    function clearSVG(){
        let svg = d3.select("#sankey");
        svg.selectAll("*").remove();
    }

    /**
     * extracts the relevant data from the json and builds the graphs for all teams
     * all graphs are saved in the graphs.graph[] array
     * 
     * @param {the json that contains all the transfer data} data 
     */
    function buildGraphs(data){
        for(let k = 0; k < firstDiv.length; k++){
            let team = firstDiv[k];
            let teamGraph = {"nodes": [], "links": []};
            for(let j = 8; j < 18; j++){
                let season = data[j + "_" + (j+1)];

                for(let i = 0; i < season.length; i++){
                    let nameFrom = getTag(season[i]["Von"]);
                    let nameTo = getTag(season[i]["An"]);
                    if(nameFrom === team){
                        nameTo = nameTo + "To";
                    } else if (nameTo === team) {
                        nameFrom = nameFrom + "Fr";
                    } else {
                        continue;
                    }

                    if(!isInArray(nameFrom, teamGraph.nodes)){
                        teamGraph.nodes.push(nameFrom);
                    }
                    if(!isInArray(nameTo, teamGraph.nodes)){
                        teamGraph.nodes.push(nameTo);
                    }

                    let position = getLinkIndexInGraphLinks(nameFrom, nameTo, teamGraph.links);
                    if(position !== -1){
                        teamGraph.links[position].value = teamGraph.links[position].value + 1;
                    } else {
                        teamGraph.links.push({"source": nameFrom, "target": nameTo, "value": 1});
                    }
                }
            }
            allGraphs.graphs.push(teamGraph);
        }
    }

    function loadGraphForSeletedTeam(){
        let index = getIndexInArray(selectedTeam, firstDiv);
        if(index >= 0){
            graph = allGraphs.graphs[index];
        } else {
            graph = undefined;
            console.log("Indexfehler " + selectedTeam);
        }
    }

    /*
        returns the tag that should represent a team in the diagram
        German teams have their name as their tag
        but e.g. Chelsea, Barcelona, etc. are grouped under the tag "Ausland"
    */
    function getTag(name){
        if(isInArray(name, firstDiv) || isInArray(name, otherGerDiv) || name === "Karriereende" || name === "pausiert" || name === "Vereinslos"){
            return name;
        } else if (isInArray(name, youth)){
            return "Jugend";
        } else {
            return "Ausland";
        }
        
    }

    function buildSankey(){
        let svg = d3.select(svgID);

        let sankey = d3.sankey()
            .nodeWidth(20)
            .nodePadding(40)
            .size([svgWidth, svgHeight]);

        sankey.nodes(graph.nodes)
            .links(graph.links)
            .layout(32);

        addToDOM(svg, sankey);
    }

    /**
     * replaces text in the graph array with indexes
     * otherwise the sankey object couldn't process the graph
     */
    function replaceTextWithIndex(){
        for(let i = 0; i < allGraphs.graphs.length; i++){
            allGraphs.graphs[i].links.forEach(function (d, index) {
                allGraphs.graphs[i].links[index].source = allGraphs.graphs[i].nodes.indexOf(allGraphs.graphs[i].links[index].source);
                allGraphs.graphs[i].links[index].target = allGraphs.graphs[i].nodes.indexOf(allGraphs.graphs[i].links[index].target);
            });
        
            allGraphs.graphs[i].nodes.forEach(function (d, index) {
                allGraphs.graphs[i].nodes[index] = { "name": d };
            });
        }
    }

    /**
     * inserts the nodes and the links between the nodes into the DOM
     * 
     * @param {the svg in the DOM} svg
     * @param {the sankey object} sankey
     */
    function addToDOM(svg, sankey){

        let nameEnding;
        let path = sankey.link();
        let gElements = svg.append("g")
            .attr("transform", "translate(200, 0)").append("g").selectAll("g")
            .data(graph.links)
            .enter().append("path")
            .attr("class", function(d){
                nameEnding = d.source.name.substring(d.source.name.length - 2, d.source.name.length);
                if(nameEnding === "Fr") {
                    return linkFromClassName;
                } else {
                    return linkToClassName;
                }
            })
            .attr("d", path)
            .attr("index", function(d, i){
                return i;
            })
            .attr("value", function(d){
                return d.value;
            })
            .style("stroke-width", function(d){
                return Math.max(1, d.dy);
            })
            .sort(function(a,b){return b.dy - a.dy});

        let node = svg.selectAll("g").append("g").attr("id", "nodes").selectAll("g")
            .data(graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d){
                return "translate(" + d.x + "," + (d.y) + ")";
            })
            .attr("index", function(d, i){
                return i;
            });
        
        node.append("rect")
            .attr("height", function(d) {return d.dy})
            .attr("width", sankey.nodeWidth())
            .style("fill", "black");
        
        node.append("text")
            .attr("x", function(d){
                if(d.name != selectedTeam){
                    nameEnding = d.name.substring(d.name.length - 2, d.name.length);
                    if(nameEnding === "To"){
                        return sankey.nodeWidth() + 6;
                    } else {
                        return -6;
                    }
                } else {
                    return 0;
                }
            })
            .attr("y", function(d) {
                if(d.name != selectedTeam){
                    return d.dy / 2;
                } else {
                    return -15;
                }
            })
            .attr("dy", ".35em")
            .attr("text-anchor", function(d){
                if(d.name != selectedTeam){
                    nameEnding = d.name.substring(d.name.length - 2, d.name.length);
                    if(nameEnding === "To"){
                        return "start";
                    } else {
                        return "end";
                    }
                } else {
                    return "middle";
                }
            })
            .attr("graphName", function(d){
                return d.name;
            })
            .text(function(d){
                nameEnding = d.name.substring(d.name.length - 2, d.name.length);
                if(nameEnding === "To" || nameEnding === "Fr"){
                    return d.name.slice(0, d.name.length - 2); 
                } else {
                    return d.name;
                }
                
            })
    }

    /*
        checks if the passed name is in the passed array
    */
    function isInArray(name, array){
        for(let i = 0; i < array.length; i++){
            if(array[i] === name){
                return true;
            }
        }
        return false;
    }

    function getIndexInArray(name, array){
        for(let i = 0; i < array.length; i++){
            if(array[i] === name){
                return i;
            }
        }
        return -1;
    }

    /*
        returns the index of the object in the links array
        that matches the passed variables from (source) and to (target)
    */
    function getLinkIndexInGraphLinks(from, to, links){
        for(let i = 0; i < links.length; i++){
            if(links[i].source === from && links[i].target === to){
                return i;
            }
        }
        return -1;
    }

    /*
        returns the index of the passed name in the graphs.nodes array
        if the name is not in the array, the function returns -1
    */
    function getIndexInNodesArray(name){
        for(let i = 0; i < graph.nodes.length; i++){
            if(graph.nodes[i].name === name){
                return i;
            }
        }
        return -1;
    }

    /*
        adds an extra text element to the selected team element (the one in the middle)
        that shows the transfer value;
        sets also a id for the selected team element for better identification
    */
    function addTextElementForTransferValue(){
        let index = getIndexInNodesArray(selectedTeam, graph.nodes);
        if(index >= 0)
        {
            let nodes = d3.select(nodesID);
            let g = nodes._groups[0][0].childNodes[index];
            g = d3.select(g).attr("id", selectedTeamID.substring(1, selectedTeamID.length));

            //repositionSelectedTeamLabel(g);

            g.append("text")
                .attr("y", 20 + g._groups[0][0].__data__.dy)
                .attr("id", transferValueID.substring(1, transferValueID.length));
        } else {
            console.log("Indexfehler");
        }

        setHoverFunctions();
        setOnClickFunction();
    }

    /**
     * sets the hover ability for the links and the nodes in the sankey
     */
    function setHoverFunctions(){

        $("." + linkToClassName).hover(function(){
            emphasizeLink(emphasizeTo, $(this));
        }, function(){
            let $this = $(this);
            if($currentlyClickedLink === undefined || $currentlyClickedLink[0].attributes[1] !== $this[0].attributes[1]){
                deemphasizeLink($this);
            }
        });

        $("." + linkFromClassName).hover(function(){
            emphasizeLink(emphasizeFrom, $(this));
        }, function(){
            let $this = $(this);
            if($currentlyClickedLink === undefined || $currentlyClickedLink[0].attributes[1] !== $this[0].attributes[1]){
                deemphasizeLink($this);
            }
        });

        $(".node").hover(function(){
            let $this = $(this);
            let value = $this[0].__data__.value;
            showTransferValue(value);
        }, function(){
            checkForHidingTransferValue();
        });
    }

    /**
     * sets the click functionality for the links in the sankey
     */
    function setOnClickFunction(){
        $("." + linkFromClassName).click(function(){
            let $this = $(this);
            if($currentlyClickedLink === undefined){
                $currentlyClickedLink = $this;
                emphasizeLink(emphasizeFrom, $this);
            } else if ($currentlyClickedLink[0].attributes[1] === $this[0].attributes[1]){
                $currentlyClickedLink = undefined;
            } else {
                deemphasizeLink($currentlyClickedLink);
                emphasizeLink(emphasizeFrom, $this);
                $currentlyClickedLink = $this;
            }
        });

        $("." + linkToClassName).click(function(){
            let $this = $(this);
            if($currentlyClickedLink === undefined){
                $currentlyClickedLink = $this;
                emphasizeLink(emphasizeTo, $this);
            } else if ($currentlyClickedLink[0].attributes[1] === $this[0].attributes[1]){
                $currentlyClickedLink = undefined;
            } else {
                deemphasizeLink($currentlyClickedLink);
                emphasizeLink(emphasizeTo, $this);
                $currentlyClickedLink = $this;
            }
        });
    }

    /**
     * highlights $this by adding a class
     * sets the tranfer value of $this
     * 
     * @param {the class that should be added} className 
     * @param {the object to which the class should be added} $this 
     */
    function emphasizeLink(className, $this){
        let value = $this[0].__data__.value;
        showTransferValue(value);
        $this.addClass(className);
    }

    /**
     * removes the highlighting class from $this
     * 
     * @param {the object from which the class should be removed} $this 
     */
    function deemphasizeLink($this){
        checkForHidingTransferValue();

        if($this.hasClass(emphasizeTo)){
            $this.removeClass(emphasizeTo);
        } else if($this.hasClass(emphasizeFrom)){
            $this.removeClass(emphasizeFrom);
        }
    }

    /**
     * hides the transfer value if there is currently no link selected
     */
    function checkForHidingTransferValue(){
        if($currentlyClickedLink === undefined){
            hideTransferValue();
        } else {
            let value = $currentlyClickedLink[0].__data__.value;
            showTransferValue(value);
        }
    }

    /*
        sets the passed number as transfer value
    */
    function showTransferValue(value){
        let textElement = d3.select(transferValueID);
        textElement.text(value);
    }

    /*
        removes the transfer value number
    */
    function hideTransferValue(){
        let textElement = d3.select(transferValueID);
        textElement.text("");
    }

    /**
     * loads the sankey for the seleted team
     * 
     * @param {selected team} teamName
     */
    function loadDataForTeam(teamName){
        if(teamName !== selectedTeam){
            clearSVG();
            selectedTeam = teamName;
            
            loadGraphForSeletedTeam();
            buildSankey();
            addTextElementForTransferValue();
        }
    }

    /**
     * resizes the svg for the selected graph
     * is needed because different sankeys need different sizes to be displayed
     * 
     * @param {index for the graphSize array where individual sizes are saved} index 
     */
    function resizeSVG(index){
        let newHeight = graphSizes[index];
        svgHeight = newHeight;
        let svg = d3.select(svgID);
        if(newHeight < 950){
            svg.attr("height", 950);
        } else {
            svg.attr("height", newHeight + 50);
        }
    }



    /**
     * from here:
     * main source: Daniela's code for the sunburst
     */

    function makeTeamSelection(teams){
        let select = d3.select("#selection")
            .selectAll("div")
            .data(teams).enter()
            .append("div")
            .attr("class", "option")
            .text(function(d){ return d })
            .attr("value", function(d){ return d })
            .attr("index", function(d, i){return i})
            .on("click", onChangeTeam);
    }
    
    function onChangeTeam(){
        markSelected(this);
        resizeSVG(d3.select(this).attr("index"));
        loadDataForTeam(this.__data__);
    }

    function markSelected(object){
        for (let i = 1; i < object.parentElement.childNodes.length; i++) {
            object.parentElement.childNodes[i].classList.remove("selected");
        }
        object.classList.add("selected");
    }


    start();
}());