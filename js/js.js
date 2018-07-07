var d3 = d3 || {};

(function(){
    "use strict";

    let svgID = "#sankey";
    let svgWidth = 400;
    let svgHeight = 800;

    let firstDiv = "SV Werder Bremen,Borussia Dortmund,FC Bayern München,Borussia Mönchengladbach,Bayer 04 Leverkusen,TSG 1899 Hoffenheim,Eintracht Frankfurt,RB Leipzig,VfB Stuttgart,VfL Wolfsburg,Hannover 96,Hertha BSC,1.FSV Mainz 05,Hamburger SV,1.FC Köln,FC Augsburg,FC Schalke 04,SC Freiburg".split(",");
    let otherGerDiv = "Karlsruher SC,SC Paderborn,VfL Bochum,1860 München,Carl Zeiss Jena,1.FC Nürnberg,Stuttgart II,Wehen Wiesbaden,Hansa Rostock,B. München II,Waldh. Mannheim,Jahn Regensburg,Erzgebirge Aue,E. Frankfurt II,Alem. Aachen,Arminia Bielefeld,Roter Stern,Kickers Emden,MSV Duisburg,Energie Cottbus,SpVgg Neckarelz,VfL Bochum II,Rot Weiss Ahlen,Dynamo Dresden,B. Dortmund II,W. Bremen II,1.FC Heidenheim,VfR Aalen,FC Ingolstadt 04,SV Darmstadt 98,Wolfsburg II,Schwabmünchen,1.FC Kaiserslautern,SC Fortuna Köln,Würzb. Kickers,Eintracht Braunschweig,TuS Haltern,RW Darmstadt,TS Ober-Roden,Rot-Weiß Erfurt,FSV Mainz 05 II,VfB Ginsheim,SV Elversberg,W. Nordhausen,Hannover 96 II,Fortuna Düsseldorf,SC Freiburg II,Schalke 04 II,Viktoria Köln,Preußen Münster,K'lautern II,FSV Erlangen-B.,K. Offenbach,Stuttg. Kickers,Union Berlin,VfL Osnabrück,FC St. Pauli,TSV Neusäß,TSV Gersthofen,TSV Aindling,Saarbrücken,RW Oberhausen,FSV Frankfurt,Eintracht Frankfurt,Holstein Kiel,1.FC Magdeburg,Unterhaching,Chemnitzer FC,Nürnberg II,SV Sandhausen,Hoffenheim II,Hertha BSC II,SpVgg Greuther Fürth,M'gladbach II".split(",");
    let youth = "K'lautern U19,B. Dortmund U19,A. Aachen U19,VfL Bochum U19,Mainz 05 U19,Hertha BSC U19,Schalke 04 U19,M'gladbach U19,1.FC Köln U19,TSV 1860 U19,Wolfsburg U19,Hamburg U19,Stuttgart U19,B. München U19,Karlsruhe U19,Frankfurt U19,Leverkusen U19".split(",");

    let graph = {"nodes": [], "links": []};

    function start(){
        d3.json("JSON/player_movement.json").then(function(data){
            buildGraph(data, "FC Bayern München");
            buildSankey();
        });
    }

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

    function pushNewLinkObject(from, to){
        graph.links.push({"source": from, "target": to, "value": 1});
    }

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
        
        console.log(graph);
        let path = sankey.link();
        let gElements = svg.append("g")
            .attr("transform", "translate(200, 0)").append("g").selectAll("g")
            .data(graph.links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", path)
            .style("stroke-width", function(d){return Math.max(1, d.dy)})
            .sort(function(a,b){return b.dy - a.dy});
        
        gElements.append("title")
            .text(function(d){
                return d.source.name
                + " → " + 
                d.target.name + "\n" + d3.format(d.value);
            });

        let node = svg.selectAll("g").append("g").selectAll("g")
            .data(graph.nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d){
                return "translate(" + d.x + "," + (d.y) + ")";
            });
        
        node.append("rect")
            .attr("height", function(d) {return d.dy})
            .attr("width", sankey.nodeWidth())
            .style("fill", "black")
            .append("title")
            .text(function(d){
                return d.name;
            });

        node.append("text")
            .attr("x", -6)
            .attr("y", function(d) { return d.dy / 2; })
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .attr("transform", null)
            .text(function(d) { return d.name; })
    }

    function isNameInGraphNodes(name){
        for(let i = 0; i < graph.nodes.length; i++){
            if(graph.nodes[i] === name){
                return true;
            }
        }
        return false;
    }

    function getLinkIndexInGraphLinks(from, to){
        for(let i = 0; i < graph.links.length; i++){
            if(graph.links[i].source === from && graph.links[i].target === to){
                return i;
            }
        }
        return -1;
    }

    start();
}());