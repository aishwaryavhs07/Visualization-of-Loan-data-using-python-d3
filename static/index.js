var height = 500;
var width = 1000;


function plotgraphs(url,caption,check, check_matrix_plot, scree_check,orgcheck ) {
	$.ajax({
	  type: 'GET',
	  url: url,
      contentType: 'application/json; charset=utf-8',
	  xhrFields: {
		withCredentials: false
	  },
	  headers: {
	  },
	  success: function(result) {
	    if(check_matrix_plot) {
		    plot_matrix_graphs(result, check, caption,orgcheck);
		} else {
		    plot_scatter_graphs(result, check, caption,orgcheck);
		}
		if(scree_check) {
		     plot_scree_graphs(result,check, caption,orgcheck)
		}
	  },
	  error: function(result) {
		$("#error").html(result);
	  }
	});
}

function plot_scree_graphs(eigen_values,check, caption,orgcheck) {

    if(!check)
        document.getElementById("displaytext").innerHTML = " Intrinsic dimensionality for stratified data is  4 ";
    else
        document.getElementById("displaytext").innerHTML = "Intrinsic dimensionality for random data  is  3";

    if (orgcheck)
        document.getElementById("displaytext").innerHTML = "Intrinsic dimensionality for original data  is  4";


    var data = JSON.parse(eigen_values);
    d3.select('#mainid').remove();

    var margin = {top: 20, right: 20, bottom: 30, left: 60};
    var width = 1400 - margin.left - margin.right;
    var height = 450 - margin.top - margin.bottom;

    var boxwidth = 800;
    var boxheight = height + margin.top + margin.bottom;
    var elbowX, elbowY
    var color = d3.scale.category10();

    var x = d3.scale.linear().domain([0, data.length ]).range([0, boxwidth - 120]);
    var y = d3.scale.linear().domain([0, d3.max(data)]).range([height, 0]);

    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left");

    
    var line = d3.svg.line()
        .x(function(d,i) {
            if (check && i == 3 ) {
                elbowX = x(i);
                elbowY = y(d);
            }
            else if(!check &&  i == 4 )
            {
                elbowX = x(i);
                elbowY = y(d);
            }  else if(orgcheck && i==4)
            {
                elbowX = x(i);
                elbowY = y(d);
            }
            return x(i);
        })
        .y(function(d) {
            return y(d);
        })


    var svg = d3.select("body").append("svg")
          .attr("id", "mainid")
          .attr("height", height + margin.top + margin.bottom + 10)
          .attr("width", width + margin.left + margin.right)
          .append("g")
          .attr("transform", "translate(250,10)");
    svg.append("g")
          .attr("class", "x_axis")
          .attr("transform", "translate(215," + height + ")")
        .style({ 'stroke': 'black', 'fill': 'None', 'stroke-width': '1.5px'})
          .call(xAxis);

    svg.append("g")
          .attr("class", "y_axis")
          .attr("transform", "translate(215,0)")
        .style({ 'stroke': 'black', 'fill': 'None', 'stroke-width': '1.5px'})
          .call(yAxis);

    svg.append("path")
        .attr("d", line(data))
        .attr("transform", "translate(215,0)")
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", "1px")

    svg.selectAll(".point")
        .data(data)
        .enter()
        .append("circle")
        .attr("id", "scree")
        .attr("r", 4)
        .attr("cx", function(d,i) { return x(i); })
        .attr("cy", function(d) { return y(d); })
        .attr("transform", "translate(215,0)")
        .style("stroke", "#456")
        .style("stroke-width", 1.5)
        .style("fill", "green")

    svg.append("circle")
              .attr("cx", elbowX)
              .attr("cy", elbowY)
              .attr("r", 7)
              .attr("transform", "translate(215,0)")
              .style("fill", "orange");

    svg.append("text")
            .attr("class", "axis_label")
            .style("font-size", "16px")
            .attr("text-anchor", "middle")
            .attr("transform", "translate("+ (150) +","+(height/2)+")rotate(-90)")
            .text("Eigen Values");

    svg.append("text")
        .attr("class", "axis_label")
        .style("font-size", "16px")
        .attr("text-anchor", "middle")
        .attr("transform", "translate("+ (boxwidth/2) +","+(boxheight)+")")
        .text("number of components");

    svg.append("text")
        .attr("x", (width / 3))
        .attr("y", 0 + (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text(caption);
}

function helper(a, b) {
    var c = [], i, j;
    for (i = -1; ++i < a.length;) for (j = -1; ++j < b.length;) c.push({x: a[i], i: i, y: b[j], j: j});
    return c;
}


function plot_scatter_graphs(input_data, check, caption,orgcheck) {

    document.getElementById("displaytext").innerHTML = " ";
    d3.select('#mainid').remove();
    var data = JSON.parse(input_data);

    var array = [];
    var min = 0, max = 0;

    feature_keys = Object.keys(data);

    for(var i=0; i< Object.keys(data[0]).length; ++i){
        arrobj = {}
        arrobj.x = data[0][i];
        arrobj.y = data[1][i];
        arrobj.clusterid = data['clusterid'][i]
        arrobj.ftr1 = data[feature_keys[0]][i]
        arrobj.ftr2 = data[feature_keys[1]][i]
        array.push(arrobj);
    }
    data = array;

    var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

    var yValue = function(d) { return d.y;}, yScale = d3.scale.linear().range([height, 0]),
        yMap = function(d) { return yScale(yValue(d));}, yAxis = d3.svg.axis().scale(yScale).orient("left");

    var xValue = function(d) { return d.x;}, xScale = d3.scale.linear().range([0, width]),
        xMap = function(d) { return xScale(xValue(d));}, xAxis = d3.svg.axis().scale(xScale).orient("bottom");


    var pp
    if(check) {
        pp = function(d) { return d.clusteridx;}
    } else if(!check && !orgcheck) {
        pp = function(d) { return d.clusterid;}
    }else if(orgcheck){
        pp = function(d) { return d.clusteridx;}
    }
    var color = d3.scale.category10();

    var svg = d3.select("body").append("svg")
        .attr('id', 'mainid')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var tooltip = d3.select("body").append('div').style('position','absolute');

    xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
    yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);

    svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .attr("class", "x_axis")
        .style({ 'stroke': 'black', 'fill': 'None', 'stroke-width': '1.5px'})
          .call(xAxis)
        .append("text")
          .attr("class", "label")
          .attr("y", -6)
          .attr("x", width)
          .text("component 1")
          .style("text-anchor", "end");

    svg.append("g")
          .attr("class", "y_axis")
         .style({ 'stroke': 'black', 'fill': 'None', 'stroke-width': '1.5px'})
          .call(yAxis)
        .append("text")
          .attr("class", "label")
          .attr("y", 6)
          .attr("transform", "rotate(-90)")
          .attr("dy", ".71em")
          .text("component 2")
          .style("text-anchor", "end");

    svg.selectAll(".dot")
          .data(data)
          .enter().append("circle")
          .attr("class", "dot")
          .attr("cx", xMap)
          .attr("r", 3.5)
          .attr("cy", yMap)
          .style("fill", function(d) { return color(pp(d));});
          

    svg.append("text")
        .attr("x", (width / 2))
        .attr("y", 0 + (margin.top / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .style("font-weight", "bold")
        .text(caption);
}

function plot_matrix_graphs(input_data, check, caption,orgcheck){

    document.getElementById("displaytext").innerHTML = "Top 3 attributes are TENURE, PRC_FULL_PAYMENT, BALANCE";
    d3.select('#mainid').remove();
    var json_data_obj = JSON.parse(input_data);
    var color = d3.scale.category20();
    var width = 1000,size = 230,padding = 40;
    
    data = {};

    var feature_keys = Object.keys(json_data_obj);
    data[feature_keys[0]] = json_data_obj[feature_keys[0]];
    data[feature_keys[1]] = json_data_obj[feature_keys[1]];
    data[feature_keys[2]] = json_data_obj[feature_keys[2]];
    data[feature_keys[3]] = json_data_obj[feature_keys[3]];
    

    var x = d3.scale.linear()
        .range([padding/2, size - padding/2]);

    var y = d3.scale.linear()
        .range([size - padding/2, padding/2]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom")
        .ticks(6);

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left")
        .ticks(6);

    

    var feature_map_dom = {},
      feature_keys = d3.keys(data).filter(function(d) { return d !== "clusterid"; }),
      n = feature_keys.length;

    xAxis.tickSize(size * n);
    yAxis.tickSize(-size * n);
    feature_keys.forEach(function(ftrName) {
        feature_map_dom[ftrName] = d3.extent(d3.values(data[ftrName]));
    });

    var svg = d3.select("body").append("svg")
        .attr('id', 'mainid')
        .attr("width", size * n + padding)
        .attr("height", size * n + padding)
        .append("g")
        .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

    svg.selectAll(".x.axis")
        .data(feature_keys)
        .enter().append("g")
        .attr("class", "x axis")
        .attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
        .each(function(d) { x.domain(feature_map_dom[d]); d3.select(this).call(xAxis); });

    svg.selectAll(".y.axis")
        .data(feature_keys)
        .enter().append("g")
        .attr("class", "y axis")
        .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
        .each(function(d) { y.domain(feature_map_dom[d]); d3.select(this).call(yAxis); });

    svg.append("text")
        .attr("x", (width / 2.8))
        .attr("y", 0 + (5))
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("text-decoration", "underline")
        .style("font-weight", "bold")
        .text(caption);

    var cell = svg.selectAll(".cell")
        .data(helper(feature_keys, feature_keys))
        .enter().append("g")
        .attr("class", "cell")
        .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
        .each(plot);

    cell.filter(function(d) { return d.i === d.j; }).append("text")
        .attr("x", padding)
        .attr("y", padding)
        .attr("dy", ".71em")
        .text(function(d) { return d.x; });

    function plot(p) {
          var cell = d3.select(this);
          x.domain(feature_map_dom[String(p.x)]);
          y.domain(feature_map_dom[String(p.y)]);
          cell.append("rect")
              .attr("class", "frame")
              .attr("x", padding / 2)
              .attr("y", padding / 2)
              .attr("width", size - padding)
              .attr("height", size - padding);

        
          
          component_one = data[String(p.x)];
          component_two = data[String(p.y)];
          
          cluster = data['clusterid']
          result_array = []
          d3.values(component_one).forEach(function(item, index) {
              temp_map = {};
              temp_map["x"] = item;
              temp_map["y"] = d3.values(component_two)[index];
              temp_map["clusterid"] = cluster[index];
              result_array.push(temp_map);
          });

          cell.selectAll("circle")
              .data(result_array)
              .enter().append("circle")
              .attr("cx", function(d) { return x(d.x); })
              .attr("cy", function(d) { return y(d.y); })
              .attr("r", 4)
              .style("fill", function(d) { return (check || orgcheck) ? color("green") : color(d.clusterid); });
    }
}

    
    document.getElementById("random_options").onchange = function() {


        if (this.value == "scree_random") {
            plotgraphs('/scree_random', 'Scree plot for random sampling', true, false, true, false);
        } else if (this.value == "projection1") {
            plotgraphs('/pca_random', 'Scatter plot of Data Projected into top 2 PCA vectors for random data' ,true, false, false, false);
        } else if (this.value == "euc_rand") {
            plotgraphs('/euc_rand', 'Scatter plot of MDS Euclidean for random data', true, false, false, false);
        } else if (this.value == "corr_rand") {
            plotgraphs('/correlate_rand', 'Scatter plot of MDS Correlation for random data', true, false, false, false);
        } else if (this.value == "high1") {
            plotgraphs('/threehigh_random', 'Scatter plot check_matrix_plot of Three highest PCA loaded attributes for random data',true, true, false, false);
        } 
    }

    document.getElementById("org_options").onchange = function() {


        if (this.value == "scree") {
            plotgraphs('/pca_scree', 'Scree plot before sampling', false, false, true,true);
        }else if (this.value == "orgprojection") {
            plotgraphs('/pca_original', 'Scatter plot of Data Projected into top 2 PCA vectors for original data', false, false, false,true);
        }else if (this.value == "orgeuc") {
            plotgraphs('/euc_org', 'Scatter plot of MDS Euclidean for original data',false, false, false,true);
        } else if (this.value == "orgcorr") {
            plotgraphs('/correlate_org',  'Scatter plot of MDS Correlation for original data',false, false, false,true);
        } else if (this.value == "orghigh") {
            plotgraphs('/threehigh_org',  'Scatter plot check_matrix_plot of Three highest PCA loaded attributes for original data',false, true, false,true);
        } 
    }
    
     document.getElementById("strat_options").onchange = function() {

        if (this.value == "scree2") {
            plotgraphs('/scree_strat', 'Scree plot visualization for stratified sampling', false, false, true, false);
        } else if (this.value == "projection2") {
            plotgraphs('/pca_strat', 'Stratified Data Projected into top 2 PCA vectors via  2D Scatter Plot', false, false, false, false);
        } else if (this.value == "euc_strat") {
            plotgraphs('/euc_strat', 'Stratified data via Euclidean Distance MDS in 2D scatterplots' ,false, false, false, false);
        } else if (this.value == "corr_strat") {
            plotgraphs('/correlate_strat', 'Stratified data via Correlation Distance MDS in 2D scatterplots', false, false, false, false);
        } else if (this.value == "high_strat") {
            plotgraphs('/threehigh_strat',  'Scatterplot matrix of the three highest PCA loaded attributes for stratified data',false, true, false, false);
        }  
     }

    d3.select('#scree').remove();

