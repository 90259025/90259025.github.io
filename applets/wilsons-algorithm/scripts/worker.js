"use strict";



onmessage = async function(e)
{
	grid_size = e.data[0];
	maximum_speed = e.data[1];
	
	importScripts("/applets/wilsons-algorithm/scripts/random-walk.js");

	Module["onRuntimeInitialized"] = async function()
	{
		postMessage(["log", "I'm alive!"]);
		
		importScripts("/scripts/wasm-arrays.min.js");
		
		//await draw_wilson_graph();
	
		//await color_graph();
		
		postMessage(["done"]);
	};
}



let grid_size = null;
let maximum_speed = null;

let edges_in_tree = [];
let vertices_not_in_tree = [];

//This has 0s for the vertices not already in the tree and 1s for the ones that are. It's 1D so that it can be passed through to the C.
let grid = [];

let new_vertices = [];

let current_row = null;
let current_column = null;

let last_direction = null;



function draw_wilson_graph()
{
	return new Promise(async function(resolve, reject)
	{
		edges_in_tree = [];
		
		//This is a one-dimensional list of length n*n, where the vertex (i, j) is at position n*i + j.
		vertices_not_in_tree = [];
		
		for (let i = 0; i < grid_size; i++)
		{
			for (let j = 0; j < grid_size; j++)
			{
				vertices_not_in_tree[grid_size * i + j] = [i, j];
				
				grid[grid_size * i + j] = 0;
			}
		}
		
		
		
		while (vertices_not_in_tree.length > 0)
		{
			await wilson_step();
		}
		
		
		
		resolve();
	});
}



function wilson_step()
{
	//We need a promise so that we can have this function actually take time to run.
	return new Promise(async function(resolve, reject)
	{
		new_vertices = [];
		
		
		
		//Pick a random vertex not in the graph.
		let new_index = Math.floor(Math.random() * vertices_not_in_tree.length);
		
		new_vertices.push(vertices_not_in_tree[new_index]);
		
		
		
		//Now perform a loop-erased random walk starting from this vertex until we hit the tree (or if it's our first walk, until a certain length is reached).
		current_row = new_vertices[0][0];
		current_column = new_vertices[0][1];
		
		
		
		if (edges_in_tree.length === 0)
		{
			wasm_random_walk(grid_size * 2);
		}
		
		else
		{
			wasm_random_walk();
		}
		
		
		
		//Draw this walk.
		for (let i = 0; i < new_vertices.length - 1; i++)
		{
			if (maximum_speed)
			{
				draw_line(new_vertices[i][0], new_vertices[i][1], new_vertices[i + 1][0], new_vertices[i + 1][1], "rgb(255, 255, 255)", 0);
			}
			
			else
			{
				await draw_line(new_vertices[i][0], new_vertices[i][1], new_vertices[i + 1][0], new_vertices[i + 1][1], "rgb(255, 255, 255)", 300 / grid_size);
			}
		}
		
		
		
		//Now we can add all the vertices and edges.
		for (let i = 0; i < new_vertices.length; i++)
		{
			grid[grid_size * new_vertices[i][0] + new_vertices[i][1]] = 1;
			
			
			
			let pop_index = vertex_in_array(new_vertices[i], vertices_not_in_tree);
			
			if (pop_index !== -1)
			{
				vertices_not_in_tree.splice(pop_index, 1);
			}
			
			if (i !== new_vertices.length - 1)
			{
				edges_in_tree.push([new_vertices[i], new_vertices[i + 1]]);
			}
		}
		
		
		
		resolve();
	});
}



//Performs a loop-erased random walk. If fixed_length === true, then rather than waiting until the walk hits the tree, it will just go until the walk is a certain length. This keeps that first walk from taking a ridiculous amount of time while still making the output graph be relatively random.
function wasm_random_walk(fixed_length = -1)
{
	console.log("calling random_walk()...");
	let return_data = ccallArrays("random_walk", "array", ["number", "array", "number", "number", "number"], [grid_size, grid, fixed_length, current_row, current_column], {heapIn: "HEAPU32", heapOut: "HEAPU32", returnArraySize: 2});
	
	let new_vertices = [];
	
	let new_vertices_ptr = return_data[0];
	let num_new_vertices = return_data[1];
	
	for (let i = 0; i < 2 * num_vertices; i++)
	{
		new_vertices.push(Module.HEAPU32[new_vertices_ptr / Uint32Array.BYTES_PER_ELEMENT + i]);
	}
	
	console.log(new_vertices);
}



function color_graph()
{
	return new Promise(async function(resolve, reject)
	{
		//First, create an array whose (i, j) entry is a list of all the connection directions from vertex (i, j).
		let connection_directions = [];
		
		for (let i = 0; i < grid_size; i++)
		{
			connection_directions[i] = [];
			
			for (let j = 0; j < grid_size; j++)
			{
				connection_directions[i][j] = [];
			}
		}
		
		
		
		for (let i = 0; i < edges_in_tree.length; i++)
		{
			let row_1 = edges_in_tree[i][0][0];
			let column_1 = edges_in_tree[i][0][1];
			
			let row_2 = edges_in_tree[i][1][0];
			let column_2 = edges_in_tree[i][1][1];
			
			
			
			//The rows are the same, so the direction is either left or right.
			if (row_1 === row_2)
			{
				if (!(connection_directions[row_1][Math.min(column_1, column_2)].includes(1)))
				{
					connection_directions[row_1][Math.min(column_1, column_2)].push(1);
				}
				
				if (!(connection_directions[row_2][Math.max(column_1, column_2)].includes(3)))
				{
					connection_directions[row_2][Math.max(column_1, column_2)].push(3);
				}
			}
			
			//The columns are the same, so the direction is either up or down.
			else
			{
				if (!(connection_directions[Math.min(row_1, row_2)][column_1].includes(2)))
				{
					connection_directions[Math.min(row_1, row_2)][column_1].push(2);
				}
				
				if (!(connection_directions[Math.max(row_1, row_2)][column_1].includes(0)))
				{
					connection_directions[Math.max(row_1, row_2)][column_2].push(0);
				}
			}
		}
		
		
		
		let edges_by_distance = [];
		
		
		
		//Now start at the middle of the graph. The syntax for a path is (row, column, distance from center).
		let active_paths = [];
		
		if (grid_size % 2 === 1)
		{
			active_paths = [[Math.floor(grid_size / 2), Math.floor(grid_size / 2), 0]];
		}
		
		else
		{
			active_paths =
			[
				[Math.floor(grid_size / 2) - 1, Math.floor(grid_size / 2) - 1, 0],
				[Math.floor(grid_size / 2) - 1, Math.floor(grid_size / 2), 0],
				[Math.floor(grid_size / 2), Math.floor(grid_size / 2) - 1, 0],
				[Math.floor(grid_size / 2), Math.floor(grid_size / 2), 0]
			];
		}
		
		
		
		let distance_from_center = [];
		
		for (let i = 0; i < grid_size; i++)
		{
			distance_from_center[i] = [];
			
			for (let j = 0; j < grid_size; j++)
			{
				distance_from_center[i][j] = -1;
			}
		}
		
		
		
		//While there are still paths active, extend each one.
		while (active_paths.length > 0)
		{
			let num_active_paths = active_paths.length;
			
			
			
			//For every vertex connected to each active path end, make a new path, but only if we've never been there before.
			for (let i = 0; i < num_active_paths; i++)
			{
				let row = active_paths[i][0];
				let column = active_paths[i][1];
				let distance = active_paths[i][2];
				
				//Record how far away from the center we are.
				distance_from_center[row][column] = distance;
				
				
				
				if (connection_directions[row][column].includes(0) && distance_from_center[row - 1][column] === -1)
				{
					active_paths.push([row - 1, column, distance + 1]);
					edges_by_distance.push([[row, column], [row - 1, column], distance]);
				}
				
				if (connection_directions[row][column].includes(1) && distance_from_center[row][column + 1] === -1)
				{
					active_paths.push([row, column + 1, distance + 1]);
					edges_by_distance.push([[row, column], [row, column + 1], distance]);
				}
				
				if (connection_directions[row][column].includes(2) && distance_from_center[row + 1][column] === -1)
				{
					active_paths.push([row + 1, column, distance + 1]);
					edges_by_distance.push([[row, column], [row + 1, column], distance]);
				}
				
				if (connection_directions[row][column].includes(3) && distance_from_center[row][column - 1] === -1)
				{
					active_paths.push([row, column - 1, distance + 1]);
					edges_by_distance.push([[row, column], [row, column - 1], distance]);
				}
			}
			
			
			
			//Now remove all of the current paths.
			active_paths.splice(0, num_active_paths);
		}
		
		
		
		//Now that we finally have all the edges organized by distance, we can loop through all of them in order.
		edges_by_distance.sort((a, b) => a[2] - b[2]);
		
		//The factor of 7/6 makes the farthest color from red be colored pink rather than red again.
		let max_distance = edges_by_distance[edges_by_distance.length - 1][2] * 7/6;
		
		
		
		//We want to draw each color at once, so we need to split up the edges into sections with constant distance.
		
		let distance_breaks = [0];
		let current_distance = 0;
		
		for (let i = 0; i < edges_by_distance.length; i++)
		{
			if (edges_by_distance[i][2] > current_distance)
			{
				distance_breaks.push(i);
				current_distance++;
			}
		}
		
		distance_breaks.push(edges_by_distance.length);
		
		
		
		//Now, finally, we can draw the colors.
		for (let i = 0; i < distance_breaks.length; i++)
		{
			let j = 0;
			
			for (j = distance_breaks[i]; j < distance_breaks[i + 1] - 1; j++)
			{
				let rgb = HSVtoRGB(edges_by_distance[j][2] / max_distance, 1, 1);
				
				draw_line(edges_by_distance[j][0][0], edges_by_distance[j][0][1], edges_by_distance[j][1][0], edges_by_distance[j][1][1], `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`, 0);
			}
			
			
			
			//We only wait for this one.
			let rgb = HSVtoRGB(edges_by_distance[j][2] / max_distance, 1, 1);
				
			await draw_line(edges_by_distance[j][0][0], edges_by_distance[j][0][1], edges_by_distance[j][1][0], edges_by_distance[j][1][1], `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`, 24);
		}
		
		
		
		resolve();
	});
}



function draw_line(row_1, column_1, row_2, column_2, color, delay)
{
	return new Promise(function(resolve, reject)
	{
		if (column_1 === column_2)
		{
			let x = column_1;
			let y = Math.min(row_1, row_2);
			
			postMessage([2 * x + 1, 2 * y + 1, 1, 3, color]);
		}
		
		else
		{
			let x = Math.min(column_1, column_2);
			let y = row_1;
			
			postMessage([2 * x + 1, 2 * y + 1, 3, 1, color]);
		}
		
		
		
		setTimeout(resolve, delay);
	});
}



function vertex_in_array(element, array)
{
	for (let i = 0; i < array.length; i++)
	{
		if (array[i][0] === element[0] && array[i][1] === element[1])
		{
			return i;
		}
	}
	
	return -1;
}



function HSVtoRGB(h, s, v)
{
	let r, g, b, i, f, p, q, t;
	
	i = Math.floor(h * 6);
	f = h * 6 - i;
	p = v * (1 - s);
	q = v * (1 - f * s);
	t = v * (1 - (1 - f) * s);
	
	switch (i % 6)
	{
		case 0: r = v, g = t, b = p; break;
		case 1: r = q, g = v, b = p; break;
		case 2: r = p, g = v, b = t; break;
		case 3: r = p, g = q, b = v; break;
		case 4: r = t, g = p, b = v; break;
		case 5: r = v, g = p, b = q; break;
	}
    
	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}