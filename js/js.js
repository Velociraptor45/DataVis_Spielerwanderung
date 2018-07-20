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
    let svgWidth = 400;
    let svgHeight = 800;

    let firstDiv = "SV Werder Bremen,Borussia Dortmund,FC Bayern München,Borussia Mönchengladbach,Bayer 04 Leverkusen,TSG 1899 Hoffenheim,Eintracht Frankfurt,RB Leipzig,VfB Stuttgart,VfL Wolfsburg,Hannover 96,Hertha BSC,1.FSV Mainz 05,Hamburger SV,1.FC Köln,FC Augsburg,FC Schalke 04,SC Freiburg".split(",");
    let otherGerDiv = "Karlsruher SC,SC Paderborn,VfL Bochum,1860 München,Carl Zeiss Jena,1.FC Nürnberg,Stuttgart II,Wehen Wiesbaden,Hansa Rostock,B. München II,Waldh. Mannheim,Jahn Regensburg,Erzgebirge Aue,E. Frankfurt II,Alem. Aachen,Arminia Bielefeld,Roter Stern,Kickers Emden,MSV Duisburg,Energie Cottbus,SpVgg Neckarelz,VfL Bochum II,Rot Weiss Ahlen,Dynamo Dresden,B. Dortmund II,W. Bremen II,1.FC Heidenheim,VfR Aalen,FC Ingolstadt 04,SV Darmstadt 98,Wolfsburg II,Schwabmünchen,1.FC Kaiserslautern,SC Fortuna Köln,Würzb. Kickers,Eintracht Braunschweig,TuS Haltern,RW Darmstadt,TS Ober-Roden,Rot-Weiß Erfurt,FSV Mainz 05 II,VfB Ginsheim,SV Elversberg,W. Nordhausen,Hannover 96 II,Fortuna Düsseldorf,SC Freiburg II,Schalke 04 II,Viktoria Köln,Preußen Münster,K'lautern II,FSV Erlangen-B.,K. Offenbach,Stuttg. Kickers,Union Berlin,VfL Osnabrück,FC St. Pauli,TSV Neusäß,TSV Gersthofen,TSV Aindling,Saarbrücken,RW Oberhausen,FSV Frankfurt,Eintracht Frankfurt,Holstein Kiel,1.FC Magdeburg,Unterhaching,Chemnitzer FC,Nürnberg II,SV Sandhausen,Hoffenheim II,Hertha BSC II,SpVgg Greuther Fürth,M'gladbach II".split(",");
    let youth = "K'lautern U19,B. Dortmund U19,A. Aachen U19,VfL Bochum U19,Mainz 05 U19,Hertha BSC U19,Schalke 04 U19,M'gladbach U19,1.FC Köln U19,TSV 1860 U19,Wolfsburg U19,Hamburg U19,Stuttgart U19,B. München U19,Karlsruhe U19,Frankfurt U19,Leverkusen U19".split(",");

    let graph = {"nodes": [], "links": []};

    let selectedTeam = "FC Bayern München";

    let $currentlyClickedLink = undefined;

    function start(){
        d3.json("JSON/player_movement.json").then(function(data){
            buildGraph(data, selectedTeam);
            buildSankey();
            addTextElementForTransferValue();
        });
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

    function buildGraph(data, selectedTeam){
        for(let j = 8; j < 18; j++){
            let season = data[j + "_" + (j+1)];

            for(let i = 0; i < season.length; i++){
                let nameFrom = getTag(season[i]["Von"]);
                let nameTo = getTag(season[i]["An"]);
                if(nameFrom === selectedTeam){
                    nameTo = nameTo + "To";
                } else if (nameTo === selectedTeam) {
                    nameFrom = nameFrom + "Fr";
                } else {
                    continue;
                }

                if(!isNameInGraphNodes(nameFrom)){
                    graph.nodes.push(nameFrom);
                }
                if(!isNameInGraphNodes(nameTo)){
                    graph.nodes.push(nameTo);
                }

                let position = getLinkIndexInGraphLinks(nameFrom, nameTo);
                if(position !== -1){
                    graph.links[position].value = graph.links[position].value + 1;
                } else {
                    pushNewLinkObject(nameFrom, nameTo)
                }
                
            }
        }
    }

    /*
        pushes a new object into the link array in the graph object
        from is the source team
        to is the target team
    */
    function pushNewLinkObject(from, to){
        graph.links.push({"source": from, "target": to, "value": 1});
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
        
        replaceTextWithIndex();

        sankey.nodes(graph.nodes)
            .links(graph.links)
            .layout(32);

        addToDOM(svg, sankey);
    }

    function replaceTextWithIndex(){
        graph.links.forEach(function (d, i) {
            graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
            graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
          });

        graph.nodes.forEach(function (d, i) {
            graph.nodes[i] = { "name": d };
          });
    }

    function addToDOM(svg, sankey){
        
        let nameEnding;
        console.log(graph);
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
            .style("stroke-width", function(d){return Math.max(1, d.dy)})
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
                nameEnding = d.name.substring(d.name.length - 2, d.name.length);
                if(nameEnding === "To"){
                    return sankey.nodeWidth() + 6;
                } else {
                    return -6;
                }
            })
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", function(d){
                nameEnding = d.name.substring(d.name.length - 2, d.name.length);
                if(nameEnding === "To"){
                    return "start";
                } else {
                    return "end";
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

    function isNameInGraphNodes(name){
        for(let i = 0; i < graph.nodes.length; i++){
            if(graph.nodes[i] === name){
                return true;
            }
        }
        return false;
    }

    /*
        returns the index of the object in the links array
        that matches the passed variables from (source) and to (target)
    */
    function getLinkIndexInGraphLinks(from, to){
        for(let i = 0; i < graph.links.length; i++){
            if(graph.links[i].source === from && graph.links[i].target === to){
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

            g.append("text")
                .attr("y", 60)
                .attr("id", transferValueID.substring(1, transferValueID.length));
        } else {
            console.log("Indexfehler");
        }

        setHoverFunctions();
        setOnClickFunction();
    }

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
            hideTransferValue();
        });
    }

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

    function emphasizeLink(className, $this){
        let value = $this[0].__data__.value;
        showTransferValue(value);
        $this.addClass(className);
    }

    function deemphasizeLink($this){
        if($currentlyClickedLink === undefined){
            hideTransferValue();
        } else {
            let value = $currentlyClickedLink[0].__data__.value;
            showTransferValue(value);
        }

        if($this.hasClass(emphasizeTo)){
            $this.removeClass(emphasizeTo);
        } else if($this.hasClass(emphasizeFrom)){
            $this.removeClass(emphasizeFrom);
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

    start();
}());