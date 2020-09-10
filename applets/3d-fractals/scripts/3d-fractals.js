!function()
{
	"use strict";
	
	
	
	let ctx = document.querySelector("#output-canvas").getContext("2d", {alpha: false});
	
	
	
	let image_size = 500;
	
	let image = [];
	
	let num_iterations_required = [];
	
	let pixels_to_anti_alias = [];
	
	for (let i = 0; i < image_size; i++)
	{
		image.push([]);
		num_iterations_required.push([]);
		pixels_to_anti_alias.push([]);
		
		for (let j = 0; j < image_size; j++)
		{
			image[i].push([0, 0, 0]);
			num_iterations_required[i].push(0);
			pixels_to_anti_alias[i].push(false);
		}
	}
	
	
	
	let image_plane_center_pos = [0, 1, 1];
	
	//The distance the actual camera is recessed from the image plane (along the negative forward vector)
	let focal_length = 1;
	
	let image_plane_right_vec = normalize([1, 0, 0]);
	let image_plane_up_vec = normalize([0, -.1, 1]);
	
	let light_pos = [5, 5, 5];
	let light_brightness = 1;
	
	//An object consists of a distance estimator, a color, and a reflectance.
	let objects = [[DE_sphere, [1, 0, 0], 1], [DE_plane, [0, .5, 0], 1]];
	
	
	
	let image_plane_forward_vec = normalize(cross_product(image_plane_right_vec, image_plane_up_vec));
	
	let camera_pos = [image_plane_center_pos[0] - focal_length * image_plane_forward_vec[0], image_plane_center_pos[1] - focal_length * image_plane_forward_vec[1], image_plane_center_pos[2] - focal_length * image_plane_forward_vec[2]];
	
	
	
	let max_iterations = 50;
	
	//How close a ray has to be to a surface before we consider it hit.
	let epsilon = .01;
	
	//How far away a ray has to be from everything before we kill it.
	let clipping_distance = 100;
	
	let fog_scaling = .2;
	let fog_color = [.75, .75, 1];
	
	//Gives anti-aliasing, but only when there are more iterations than average, since that usually indicates an edge.
	let num_rays_per_pixel = 8;
	
	
	
	document.querySelector("#output-canvas").setAttribute("width", image_size);
	document.querySelector("#output-canvas").setAttribute("height", image_size);
	
	document.querySelector("#generate-button").addEventListener("click", draw_frame);
	
	document.querySelector("#download-button").addEventListener("click", prepare_download);
	
	
	
	
	
	function draw_frame()
	{
		let anti_aliasing_iteration_threshhold = 0;
		
		
		
		//First, just get a color for every pixel.
		for (let row = 0; row < image_size; row++)
		{
			for (let col = 0; col < image_size; col++)
			{
				let result = calculate_pixel(row, col, false);
				
				image[row][col] = result[0];
				num_iterations_required[row][col] = result[1];
				
				anti_aliasing_iteration_threshhold += result[1];
			}
		}
		
		
		
		anti_aliasing_iteration_threshhold /= (image_size * image_size);
		
		//Then mark which pixels need anti-aliasing.
		for (let row = 0; row < image_size; row++)
		{
			for (let col = 0; col < image_size; col++)
			{
				if (num_iterations_required[row][col] > anti_aliasing_iteration_threshhold)
				{
					pixels_to_anti_alias[row][col] = true;
					
					if (row !== 0)
					{
						pixels_to_anti_alias[row - 1][col] = true;
					}
					
					if (col !== 0)
					{
						pixels_to_anti_alias[row][col - 1] = true;
					}
					
					if (row !== image_size - 1)
					{
						pixels_to_anti_alias[row + 1][col] = true;
					}
					
					if (col !== image_size - 1)
					{
						pixels_to_anti_alias[row][col + 1] = true;
					}
				}
			}
		}
		
		
		
		//Now perform anti-aliasing on the ones that seem to be near an edge.
		for (let row = 0; row < image_size; row++)
		{
			for (let col = 0; col < image_size; col++)
			{
				if (pixels_to_anti_alias[row][col])
				{
					for (let ray_index = 1; ray_index < num_rays_per_pixel; ray_index++)
					{
						let result = calculate_pixel(row, col, true);
						
						image[row][col][0] += result[0][0];
						image[row][col][1] += result[0][1];
						image[row][col][2] += result[0][2];
					}
					
					image[row][col][0] /= num_rays_per_pixel;
					image[row][col][1] /= num_rays_per_pixel;
					image[row][col][2] /= num_rays_per_pixel;
				}
			}
		}
		
		
		
		//Finally, draw the image.
		let img_data = ctx.getImageData(0, 0, image_size, image_size);
		let data = img_data.data;
		
		for (let row = 0; row < image_size; row++)
		{
			for (let col = 0; col < image_size; col++)
			{
				let index = (4 * row * image_size) + (4 * col);
				
				data[index] = image[row][col][0] * 255;
				data[index + 1] = image[row][col][1] * 255;
				data[index + 2] = image[row][col][2] * 255;
				data[index + 3] = 255;
			}
		}
		
		ctx.putImageData(img_data, 0, 0);
	}
	
	
	
	function calculate_pixel(row, col, noise)
	{
		//(u, v) gives local coordinates on the image plane (-1 <= u, v <= 1)
		let u = col / image_size * 2 - 1;
		let v = 1 - row / image_size * 2;
		
		if (noise)
		{
			u += Math.random() * (2 / image_size);
			v += Math.random() * (2 / image_size);
		}
		
		//(x, y, z) gives global coordinates.
		let start_x = image_plane_center_pos[0] + image_plane_right_vec[0] * u + image_plane_up_vec[0] * v;
		let start_y = image_plane_center_pos[1] + image_plane_right_vec[1] * u + image_plane_up_vec[1] * v;
		let start_z = image_plane_center_pos[2] + image_plane_right_vec[2] * u + image_plane_up_vec[2] * v;
		
		
		
		//Having the camera recessed from the image plane creates perspective, so every ray will go in a different direction.
		let ray_direction_vec = [start_x - camera_pos[0], start_y - camera_pos[1], start_z - camera_pos[2]];
		
		let magnitude = Math.sqrt(ray_direction_vec[0] * ray_direction_vec[0] + ray_direction_vec[1] * ray_direction_vec[1] + ray_direction_vec[2] * ray_direction_vec[2]);
		
		ray_direction_vec[0] /= magnitude;
		ray_direction_vec[1] /= magnitude;
		ray_direction_vec[2] /= magnitude;
		
		
		
		//The coefficient on the march direction vector.
		let t = 0;
		
		let iteration = 0;
		
		while (iteration < max_iterations)
		{
			let x = start_x + t * ray_direction_vec[0];
			let y = start_y + t * ray_direction_vec[1];
			let z = start_z + t * ray_direction_vec[2];
			
			
			
			//Get the distance to the scene.
			let result = distance_estimator(x, y, z);
			
			let distance = result[0];
			let object_index = result[1];
			
			if (distance < epsilon)
			{
				//Shade the point.
				return [calculate_shading(x, y, z, object_index), iteration];
			}
			
			else if (distance > clipping_distance)
			{
				return [[fog_color[0], fog_color[1], fog_color[2]], iteration];
			}
			
			
			
			t += distance;
			
			iteration++;
		}
		
		
		
		return [[fog_color[0], fog_color[1], fog_color[2]], iteration];
	}
	
	
	
	function distance_estimator(x, y, z)
	{
		let min_distance = Infinity;
		let min_index = 0;
		
		for (let i = 0; i < objects.length; i++)
		{
			let distance = objects[i][0](x, y, z);
			
			if (distance < min_distance)
			{
				min_distance = distance;
				min_index = i;
			}
		}
		
		return [min_distance, min_index];
	}
	
	
	
	function calculate_shading(x, y, z, object_index)
	{
		let normal = get_normal(x, y, z);
		
		let light_direction = normalize([light_pos[0] - x, light_pos[1] - y, light_pos[2] - z]);
		
		let light_intensity = light_brightness * dot_product(normal, light_direction);
		
		let color = [light_intensity * objects[object_index][2] * objects[object_index][1][0], light_intensity * objects[object_index][2] * objects[object_index][1][1], light_intensity * objects[object_index][2] * objects[object_index][1][2]];
		
		
		
		//Apply fog.
		let distance_from_camera = Math.sqrt(x*x + y*y + z*z);
		
		let fog_amount = 1 - Math.exp(-distance_from_camera * fog_scaling);
		
		return [(1 - fog_amount) * color[0] + fog_amount * fog_color[0], (1 - fog_amount) * color[1] + fog_amount * fog_color[1], (1 - fog_amount) * color[2] + fog_amount * fog_color[2]];
	}
	
	
	
	//Approxmiates the distance estimator's gradient, which will be the surface normal.
	function get_normal(x, y, z)
	{
		let e = .00001;
		
		let base = distance_estimator(x, y, z)[0];
		
		return normalize([(distance_estimator(x + e, y, z)[0] - base) / e, (distance_estimator(x, y + e, z)[0] - base) / e, (distance_estimator(x, y, z + e)[0] - base) / e]);
	}
	
	
	
	function dot_product(vec1, vec2)
	{
		return vec1[0] * vec2[0] + vec1[1] * vec2[1] + vec1[2] * vec2[2];
	}
	
	
	
	function cross_product(vec1, vec2)
	{
		return [vec1[1] * vec2[2] - vec1[2] * vec2[1], vec1[2] * vec2[0] - vec1[0] * vec2[2], vec1[0] * vec2[1] - vec1[1] * vec2[0]];
	}
	
	
	
	function normalize(vec)
	{
		let magnitude = Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2]);
		
		return [vec[0] / magnitude, vec[1] / magnitude, vec[2] / magnitude];
	}
	
	
	
	function DE_sphere(x, y, z)
	{
		return Math.sqrt(x*x + y*y + z*z) - .5;
	}
	
	function DE_plane(x, y, z)
	{
		return dot_product([x, y, z], [0, 0, 1]) + .5;
	}
	
	
	
	function prepare_download()
	{
		let link = document.createElement("a");
		
		link.download = "gravner-griffeath-snowflakes.png";
		
		link.href = document.querySelector("#output-canvas").toDataURL();
		
		link.click();
		
		link.remove();
	}
}()