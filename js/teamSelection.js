/**
 * main source: Daniela's code for the sunburst
 */
var d3 = d3 || {};

function getTeamSelectionObject(){
    "use strict";
    let that = {};

    function makeTeamSelection(teams){
        let select = d3.select("#selection")
            .selectAll("div")
            .data(teams).enter()
            .append("div")
            .attr("class", "option")
            .text(function(d){ return d })
            .attr("value", function(d){ return d })
            .on("click", onChangeTeam);
    }
    
    function onChangeTeam(){
        markSelected(this);
        makeChartForTeam(this.getAttribute("value"));
    }

    function markSelected(object){
        for (let i = 0; i < object.parentElement.childNodes.length; i++) {
            object.parentElement.childNodes[i].classList.remove("selected");
        }
        object.classList.add("selected");
    }

    that.makeTeamSelection = makeTeamSelection;
    return that;
}