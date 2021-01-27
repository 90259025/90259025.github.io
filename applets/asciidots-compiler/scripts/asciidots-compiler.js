!function()
{
	"use strict";
	
	
	
	let code_string = "var test; input(test); print(1 + 1);";
	
	let code = [];
	
	let code_lines = [];
	
	let new_code_lines = [];
	
	let variables = {};
	
	
	
	let num_user_variables = 0;
	
	let num_temp_variables = 0;
	
	let current_temp_variable = 0;
	
	let num_total_variables = 0;
	
	let current_max_width = 0;
	
	
	
	let parse_index = 0;
	
	let current_line_index = 0;
	
	let operations = ["+", "-", "*", "/", "%", "&", "|", "!", "?", "~", "<", ">", "[", "]"];
	
	
	
	js_to_asciidots();
	
	
	
	function js_to_asciidots()
	{
		//Clean up the code string
		prepare_code_string();
		
		console.log(code_lines);
		
		convert_code();
		
		console.log(code_lines);
	}
	
	
	
	function prepare_code_string()
	{
		code_string = code_string.replace(/var /g, "var.");
		code_string = code_string.replace(/ /g, "");
		code_string = code_string.replace(/\n/g, "");
		
		code_string = code_string.replace(/==/g, "?");
		code_string = code_string.replace(/!=/g, "~");
		code_string = code_string.replace(/<=/g, "[");
		code_string = code_string.replace(/>=/g, "]");
		
		code_lines = code_string.split(";");
		
		
		
		parse_index = 0;
		
		
		
		//Parse variable declarations
		while (parse_index < code_lines.length)
		{
			if (code_lines[parse_index].slice(0, 4) === "var.")
			{
				if (code_lines[parse_index].indexOf("=") !== -1)
				{
					let temp = code_lines[parse_index].split("=");
					
					variables[`${temp[0].slice(4)}`] = num_user_variables;
					
					num_user_variables++;
					
					code_lines.splice(parse_index + 1, 0, temp[0].slice(4) + "=" + temp[1]);
					
					code_lines[parse_index] = temp[0];
					
					parse_index += 2;
				}
				
				else
				{
					variables[`${code_lines[parse_index].slice(4)}`] = num_user_variables;
					
					num_user_variables++;
					
					parse_index++;
				}
			}
			
			else
			{
				break;
			}
		}
		
		
		
		parse_index = 0;
		
		//Parse expressions. There are only four places an expression can occur: after an = or in a print, if, or while statement.
		while (parse_index < code_lines.length)
		{
			while (code_lines[parse_index] === "")
			{
				code_lines.splice(parse_index, 1);
			}
			
			if (parse_index >= code_lines.length)
			{
				break;
			}
			
			
			
			new_code_lines = [];
			
			current_temp_variable = 0;
			
			
			
			let found_an_operation = false;
			
			for (let i = 0; i < operations.length; i++)
			{
				if (code_lines[parse_index].includes(operations[i]))
				{
					found_an_operation = true;
					
					break;
				}
			}
			
			if (!found_an_operation)
			{
				parse_index++;
				
				continue;
			}
			
			
			
			if (code_lines[parse_index].slice(0, 6) === "print(" && code_lines[parse_index][6] !== '"')
			{
				prepare_expression(code_lines[parse_index].slice(6, code_lines[parse_index].length - 1));
				
				for (let i = 0; i < new_code_lines.length; i++)
				{
					code_lines.splice(parse_index + i, 0, new_code_lines[i]);
				}
				
				parse_index += new_code_lines.length;
				
				code_lines.splice(parse_index, 1, `print(_${current_temp_variable - 1})`);
				
				parse_index++;
				
				
				
				if (current_temp_variable > num_temp_variables)
				{
					num_temp_variables = current_temp_variable;
				}
			}
			
			
			
			else if (code_lines[parse_index].slice(0, 3) === "if(")
			{
				prepare_expression(code_lines[parse_index].slice(3, code_lines[parse_index].length - 1));
				
				for (let i = 0; i < new_code_lines.length; i++)
				{
					code_lines.splice(parse_index + i, 0, new_code_lines[i]);
				}
				
				parse_index += new_code_lines.length;
				
				code_lines.splice(parse_index, 1, `_c=${current_temp_variable - 1}`);
				
				parse_index++;
				
				code_lines.splice(parse_index, 1, "if");
				
				parse_index++;
				
				
				
				if (current_temp_variable > num_temp_variables)
				{
					num_temp_variables = current_temp_variable;
				}
			}
			
			
			
			else if (code_lines[parse_index].slice(0, 6) === "while(")
			{
				prepare_expression(code_lines[parse_index].slice(6, code_lines[parse_index].length - 1));
				
				for (let i = 0; i < new_code_lines.length; i++)
				{
					code_lines.splice(parse_index + i, 0, new_code_lines[i]);
				}
				
				parse_index += new_code_lines.length;
				
				code_lines.splice(parse_index, 1, `_c=${current_temp_variable - 1}`);
				
				parse_index++;
				
				code_lines.splice(parse_index, 1, "while");
				
				parse_index++;
				
				
				
				if (current_temp_variable > num_temp_variables)
				{
					num_temp_variables = current_temp_variable;
				}
			}
			
			
			
			//Assignment
			else if (code_lines[parse_index].indexOf("=") !== -1)
			{
				prepare_expression(code_lines[parse_index].split("=")[1]);
				
				for (let i = 0; i < new_code_lines.length; i++)
				{
					code_lines.splice(parse_index + i, 0, new_code_lines[i]);
				}
				
				parse_index += new_code_lines.length;
				
				code_lines.splice(parse_index, 1, `${code_lines[parse_index].split("=")[0]}=_${current_temp_variable - 1}`);
				
				parse_index++;
				
				
				
				if (current_temp_variable > num_temp_variables)
				{
					num_temp_variables = current_temp_variable;
				}
			}
			
			
			
			else
			{
				parse_index++;
			}
		}
	}
	
	
	
	//Turns an expression in the code string into operations on temporary variables.
	function prepare_expression(expression)
	{
		//Now we apply PEMDAS. First, we'll deal with the parentheses.
		for (let i = 0; i < expression.length; i++)
		{
			if (expression[i] === "(")
			{
				//Find the closing parenthesis.
				let parenthesis_depth = 1;
				
				for (let j = i + 1; j < expression.length; j++)
				{
					if (expression[j] === "(")
					{
						parenthesis_depth++;
					}
					
					else if (expression[j] === ")")
					{
						parenthesis_depth--;
						
						if (parenthesis_depth === 0)
						{
							prepare_expression(expression.slice(i + 1, j));
							
							//Remove whatever was in these parentheses and replace it with the current temporary variable.
							expression = expression.slice(0, i) + `_${current_temp_variable - 1}` + expression.slice(j + 1, expression.length);
							
							break;
						}
					}
				}
			}
		}
		
		
		
		//Now we're guaranteed that there's no parantheses in this expression. We'll pivot to looking for operations in order, left to right.
		for (let i = 0; i < expression.length; i++)
		{
			if (expression[i] === "!")
			{
				//Multiply the things to the left and right of this.
				let lengths = find_token_lengths(expression, i);
				
				new_code_lines.push(`_${current_temp_variable}=${expression.slice(i + 1, lengths[1] + 1)}`);
				new_code_lines.push(`_${current_temp_variable}!`);
				
				expression = `_${current_temp_variable}` + expression.slice(lengths[1] + 1, expression.length);
				
				current_temp_variable++;
			}
		}
		
		
		
		for (let i = 0; i < expression.length; i++)
		{
			if (expression[i] === "&")
			{
				//Multiply the things to the left and right of this.
				let lengths = find_token_lengths(expression, i);
				
				new_code_lines.push(`_${current_temp_variable}=${expression.slice(lengths[0], i)}`);
				new_code_lines.push(`_${current_temp_variable + 1}=${expression.slice(i + 1, lengths[1] + 1)}`);
				new_code_lines.push(`_${current_temp_variable + 1}&_${current_temp_variable}`);
				
				expression = expression.slice(0, lengths[0]) + `_${current_temp_variable}` + expression.slice(lengths[1] + 1, expression.length);
				
				current_temp_variable += 2;
			}
		}
		
		
		
		for (let i = 0; i < expression.length; i++)
		{
			if (expression[i] === "|")
			{
				//Multiply the things to the left and right of this.
				let lengths = find_token_lengths(expression, i);
				
				new_code_lines.push(`_${current_temp_variable}=${expression.slice(lengths[0], i)}`);
				new_code_lines.push(`_${current_temp_variable + 1}=${expression.slice(i + 1, lengths[1] + 1)}`);
				new_code_lines.push(`_${current_temp_variable + 1}|_${current_temp_variable}`);
				
				expression = expression.slice(0, lengths[0]) + `_${current_temp_variable}` + expression.slice(lengths[1] + 1, expression.length);
				
				current_temp_variable += 2;
			}
		}
		
		
		
		for (let i = 0; i < expression.length; i++)
		{
			if (expression[i] === "*")
			{
				//Multiply the things to the left and right of this.
				let lengths = find_token_lengths(expression, i);
				
				new_code_lines.push(`_${current_temp_variable}=${expression.slice(lengths[0], i)}`);
				new_code_lines.push(`_${current_temp_variable + 1}=${expression.slice(i + 1, lengths[1] + 1)}`);
				new_code_lines.push(`_${current_temp_variable + 1}*_${current_temp_variable}`);
				
				expression = expression.slice(0, lengths[0]) + `_${current_temp_variable}` + expression.slice(lengths[1] + 1, expression.length);
				
				current_temp_variable += 2;
			}
			
			else if (expression[i] === "/")
			{
				//Multiply the things to the left and right of this.
				let lengths = find_token_lengths(expression, i);
				
				new_code_lines.push(`_${current_temp_variable}=${expression.slice(lengths[0], i)}`);
				new_code_lines.push(`_${current_temp_variable + 1}=${expression.slice(i + 1, lengths[1] + 1)}`);
				new_code_lines.push(`_${current_temp_variable + 1}/_${current_temp_variable}`);
				
				expression = expression.slice(0, lengths[0]) + `_${current_temp_variable}` + expression.slice(lengths[1] + 1, expression.length);
				
				current_temp_variable += 2;
			}
			
			else if (expression[i] === "%")
			{
				//Multiply the things to the left and right of this.
				let lengths = find_token_lengths(expression, i);
				
				new_code_lines.push(`_${current_temp_variable}=${expression.slice(lengths[0], i)}`);
				new_code_lines.push(`_${current_temp_variable + 1}=${expression.slice(i + 1, lengths[1] + 1)}`);
				new_code_lines.push(`_${current_temp_variable + 1}%_${current_temp_variable}`);
				
				expression = expression.slice(0, lengths[0]) + `_${current_temp_variable}` + expression.slice(lengths[1] + 1, expression.length);
				
				current_temp_variable += 2;
			}
		}
		
		
		
		for (let i = 0; i < expression.length; i++)
		{
			if (expression[i] === "+")
			{
				//Multiply the things to the left and right of this.
				let lengths = find_token_lengths(expression, i);
				
				new_code_lines.push(`_${current_temp_variable}=${expression.slice(lengths[0], i)}`);
				new_code_lines.push(`_${current_temp_variable + 1}=${expression.slice(i + 1, lengths[1] + 1)}`);
				new_code_lines.push(`_${current_temp_variable + 1}+_${current_temp_variable}`);
				
				expression = expression.slice(0, lengths[0]) + `_${current_temp_variable}` + expression.slice(lengths[1] + 1, expression.length);
				
				current_temp_variable += 2;
			}
			
			else if (expression[i] === "-")
			{
				//Multiply the things to the left and right of this.
				let lengths = find_token_lengths(expression, i);
				
				new_code_lines.push(`_${current_temp_variable}=${expression.slice(lengths[0], i)}`);
				new_code_lines.push(`_${current_temp_variable + 1}=${expression.slice(i + 1, lengths[1] + 1)}`);
				new_code_lines.push(`_${current_temp_variable + 1}-_${current_temp_variable}`);
				
				expression = expression.slice(0, lengths[0]) + `_${current_temp_variable}` + expression.slice(lengths[1] + 1, expression.length);
				
				current_temp_variable += 2;
			}
		}
		
		
		
		for (let i = 0; i < expression.length; i++)
		{
			if (expression[i] === "?")
			{
				//Multiply the things to the left and right of this.
				let lengths = find_token_lengths(expression, i);
				
				new_code_lines.push(`_${current_temp_variable}=${expression.slice(lengths[0], i)}`);
				new_code_lines.push(`_${current_temp_variable + 1}=${expression.slice(i + 1, lengths[1] + 1)}`);
				new_code_lines.push(`_${current_temp_variable + 1}?_${current_temp_variable}`);
				
				expression = expression.slice(0, lengths[0]) + `_${current_temp_variable}` + expression.slice(lengths[1] + 1, expression.length);
				
				current_temp_variable += 2;
			}
			
			else if (expression[i] === "~")
			{
				//Multiply the things to the left and right of this.
				let lengths = find_token_lengths(expression, i);
				
				new_code_lines.push(`_${current_temp_variable}=${expression.slice(lengths[0], i)}`);
				new_code_lines.push(`_${current_temp_variable + 1}=${expression.slice(i + 1, lengths[1] + 1)}`);
				new_code_lines.push(`_${current_temp_variable + 1}~_${current_temp_variable}`);
				
				expression = expression.slice(0, lengths[0]) + `_${current_temp_variable}` + expression.slice(lengths[1] + 1, expression.length);
				
				current_temp_variable += 2;
			}
			
			else if (expression[i] === "<")
			{
				//Multiply the things to the left and right of this.
				let lengths = find_token_lengths(expression, i);
				
				new_code_lines.push(`_${current_temp_variable}=${expression.slice(lengths[0], i)}`);
				new_code_lines.push(`_${current_temp_variable + 1}=${expression.slice(i + 1, lengths[1] + 1)}`);
				new_code_lines.push(`_${current_temp_variable + 1}<_${current_temp_variable}`);
				
				expression = expression.slice(0, lengths[0]) + `_${current_temp_variable}` + expression.slice(lengths[1] + 1, expression.length);
				
				current_temp_variable += 2;
			}
			
			else if (expression[i] === ">")
			{
				//Multiply the things to the left and right of this.
				let lengths = find_token_lengths(expression, i);
				
				new_code_lines.push(`_${current_temp_variable}=${expression.slice(lengths[0], i)}`);
				new_code_lines.push(`_${current_temp_variable + 1}=${expression.slice(i + 1, lengths[1] + 1)}`);
				new_code_lines.push(`_${current_temp_variable + 1}>_${current_temp_variable}`);
				
				expression = expression.slice(0, lengths[0]) + `_${current_temp_variable}` + expression.slice(lengths[1] + 1, expression.length);
				
				current_temp_variable += 2;
			}
			
			else if (expression[i] === "[")
			{
				//Multiply the things to the left and right of this.
				let lengths = find_token_lengths(expression, i);
				
				new_code_lines.push(`_${current_temp_variable}=${expression.slice(lengths[0], i)}`);
				new_code_lines.push(`_${current_temp_variable + 1}=${expression.slice(i + 1, lengths[1] + 1)}`);
				new_code_lines.push(`_${current_temp_variable + 1}[_${current_temp_variable}`);
				
				expression = expression.slice(0, lengths[0]) + `_${current_temp_variable}` + expression.slice(lengths[1] + 1, expression.length);
				
				current_temp_variable += 2;
			}
			
			else if (expression[i] === "]")
			{
				//Multiply the things to the left and right of this.
				let lengths = find_token_lengths(expression, i);
				
				new_code_lines.push(`_${current_temp_variable}=${expression.slice(lengths[0], i)}`);
				new_code_lines.push(`_${current_temp_variable + 1}=${expression.slice(i + 1, lengths[1] + 1)}`);
				new_code_lines.push(`_${current_temp_variable + 1}]_${current_temp_variable}`);
				
				expression = expression.slice(0, lengths[0]) + `_${current_temp_variable}` + expression.slice(lengths[1] + 1, expression.length);
				
				current_temp_variable += 2;
			}
		}
	}
	
	
	
	function find_token_lengths(expression, index)
	{
		let i = index - 1;
		let j = index + 1;
		
		while (!(operations.includes(expression[i])) && i >= 0)
		{
			i--;
		}
		
		while (!(operations.includes(expression[j])) && j <= expression.length - 1)
		{
			j++;
		}
		
		return [i + 1, j - 1];
	}
	
	
	
	//The actual workhorse here.
	function convert_code()
	{
		num_total_variables = num_user_variables + num_temp_variables + 1;
		
		current_max_width = num_total_variables;
		
		//The first step is get all of these variables.
		let current_line = "";
		
		for (let i = 0; i < num_total_variables; i++)
		{
			current_line += ".";
		}
		
		code.push(current_line);
		
		current_line_index++;
		
		
		
		code.push(get_pass_block([]));
		
		current_line_index++;
		
		
		
		//Finish setting up the variables.
		for (let i = 0; i < num_temp_variables; i++)
		{
			variables[`_${i}`] = num_user_variables + i;
		}
		
		variables["_c"] = num_user_variables + num_temp_variables;
		
		
		
		for (parse_index = 0; parse_index < code_lines.length; parse_index++)
		{
			if (code_lines[parse_index].slice(0, 4) === "var.")
			{
				continue;
			}
			
			
			
			else if (code_lines[parse_index].slice(0, 6) === "print(")
			{
				if (code_lines[parse_index][6] === '"')
				{
					write_print_string_block(code_lines[parse_index].slice(7, code_lines[parse_index].length - 2));
				}
				
				else
				{
					write_print_variable_block(variables[code_lines[parse_index].slice(6, code_lines[parse_index].length - 1)]);
				}
			}
			
			
			
			else if (code_lines[parse_index].slice(0, 6) === "input(")
			{
				write_input_block(variables[code_lines[parse_index].slice(6, code_lines[parse_index].length - 1)]);
			}
			
			
			
			else if (code_lines[parse_index].indexOf("=") !== -1)
			{
				let operation_index = code_lines[parse_index].indexOf("=");
				
				write_assignment_block(variables[code_lines[parse_index].slice(0, operation_index)], code_lines[parse_index].slice(operation_index + 1, code_lines[parse_index].length));
			}
			
			
			
			else if (code_lines[parse_index].indexOf("!") !== -1)
			{
				write_not_block(variables[code_lines[parse_index].slice(0, code_lines[parse_index].length - 1)]);
			}
			
			
			
			//All that's left is the other operations.
			else
			{
				//First, we need to find the operation.
				let operation_index = 0;
				
				for (let i = 0; i < code_lines[parse_index].length; i++)
				{
					let found_operation = false;
					
					for (let j = 0; j < operations.length; j++)
					{
						if (code_lines[parse_index][i] === operations[j])
						{
							found_operation = true;
							
							break;
						}
					}
					
					if (found_operation)
					{
						operation_index = i;
						
						break;
					}
				}
				
				write_operation_block(variables[code_lines[parse_index].slice(0, operation_index)], variables[code_lines[parse_index].slice(operation_index + 1, code_lines[parse_index].length)], code_lines[parse_index][operation_index]);
			}
		}
		
		
		output_code();
	}
	
	
	
	function output_code()
	{
		let output = "";
		
		for (let i = 0; i < code.length; i++)
		{
			output += code[i] + "\n";
		}
		
		console.log(output);
	}
	
	
	
	//Writes vertical pipes for as many variables as there are.
	function get_pass_block(exclude_indices)
	{
		let current_line = "";
		
		for (let i = 0; i < num_total_variables; i++)
		{
			if (exclude_indices.includes(i))
			{
				current_line += " ";
			}
			
			else
			{
				current_line += "|";
			}
		}
		
		return current_line;
	}
	
	
	
	//Pulls off a variable to pass into a block.
	function write_start_unary_operation(var_index)
	{
		let current_line = "";
		
		for (let i = 0; i < var_index; i++)
		{
			current_line += "|";
		}
		
		current_line += "\\";
		
		for (let i = var_index + 1; i < num_total_variables; i++)
		{
			current_line += "+";
		}
		
		//We go two past so that the block has room.
		current_line += "--\\";
		
		
		
		code.push(current_line);
		
		current_line_index++;
	}
	
	
	
	//Returns a variable from a block.
	function write_end_unary_operation(var_index)
	{
		let current_line = "";
		
		for (let i = 0; i < var_index; i++)
		{
			current_line += "|";
		}
		
		current_line += "/";
		
		for (let i = var_index + 1; i < num_total_variables; i++)
		{
			current_line += "+";
		}
		
		//We go two past so that the block has room.
		current_line += "--/";
		
		
		
		code.push(current_line);
		
		current_line_index++;
	}
	
	
	
	//Pulls off two variables to pass into a block.
	function write_start_binary_operation(var_1_index, var_2_index)
	{
		if (var_1_index === var_2_index)
		{
			console.log("Indices cannot be the same in a binary operation!");
		}
		
		
		
		let current_line = "";
		
		for (let i = 0; i < var_1_index; i++)
		{
			current_line += "|";
		}
		
		current_line += "\\";
		
		for (let i = var_1_index + 1; i < num_total_variables; i++)
		{
			current_line += "+";
		}
		
		//We go two past so that the block has room.
		current_line += "--\\";
		
		
		
		code.push(current_line);
		
		current_line_index++;
		
		
		
		current_line = "";
		
		for (let i = 0; i < var_2_index; i++)
		{
			if (i === var_1_index)
			{
				current_line += " ";
			}
			
			else
			{
				current_line += "|";
			}
		}
		
		current_line += "\\";
		
		for (let i = var_2_index + 1; i < num_total_variables; i++)
		{
			current_line += "+";
		}
		
		//For this second one, we need to go five out, and there will be a crossing.
		current_line += "--+--\\";
		
		
		
		code.push(current_line);
		
		current_line_index++;
	}
	
	
	
	//Returns two variables from a block.
	function write_end_binary_operation(var_1_index, var_2_index)
	{
		if (var_1_index === var_2_index)
		{
			console.log("Indices cannot be the same in a binary operation!");
		}
		
		
		
		let current_line = "";
		
		for (let i = 0; i < var_1_index; i++)
		{
			if (i === var_2_index)
			{
				current_line += " ";
			}
			
			else
			{
				current_line += "|";
			}
		}
		
		current_line += "/";
		
		for (let i = var_1_index + 1; i < num_total_variables; i++)
		{
			if (i === var_2_index)
			{
				current_line += "-";
			}
			
			else
			{
				current_line += "+";
			}
		}
		
		//We go two past so that the block has room.
		current_line += "--/  |";
		
		
		
		code.push(current_line);
		
		current_line_index++;
		
		
		
		current_line = "";
		
		for (let i = 0; i < var_2_index; i++)
		{
			current_line += "|";
		}
		
		current_line += "/";
		
		for (let i = var_2_index + 1; i < num_total_variables; i++)
		{
			current_line += "+";
		}
		
		current_line += "-----/";
		
		
		
		code.push(current_line);
		
		current_line_index++;
	}
	
	
	
	function write_assignment_block(var_index, value)
	{
		if (value[0] >= "0" && value <= "9")
		{
			write_start_unary_operation(var_index);
			
			
			
			let num_digits = 1;
			
			let negative = value < 0;
			
			value = Math.abs(value);
			
			if (value !== 0)
			{
				num_digits = Math.floor(Math.log10(value)) + 1;
			}
			
			let digits = [];
			
			for (let i = 0; i < num_digits; i++)
			{
				digits += value % 10;
				
				value = Math.floor(value / 10);
			}
			
			
			
			let pass_block = get_pass_block([var_index]);
			
			code.push(pass_block + "  |");
			code.push(pass_block + "  #");
			
			for (let i = 0; i < num_digits; i++)
			{
				code.push(pass_block + `  ${digits[num_digits - i - 1]}`);
			}
			
			code.push(pass_block + "  |");
			
			current_line_index += num_digits + 3;
			
			
			
			if (negative)
			{
				code.push(pass_block + "  *--\\");
				code.push(pass_block + "  |  |");
				code.push(pass_block + "  #  |");
				code.push(pass_block + "  0  |");
				code.push(pass_block + "  |  |");
				code.push(pass_block + " [-]-/");
				code.push(pass_block + "  |");
				
				current_line_index += 7;
			}
			
			
			
			write_end_unary_operation(var_index);
			
			code.push(get_pass_block([]));
			
			current_line_index++;
		}
		
		
		
		else
		{
			let var_index_2 = variables[value];
			
			write_start_binary_operation(var_index, var_index_2);
			
			
			
			let pass_block = get_pass_block([var_index, var_index_2]);
			
			code.push(pass_block + "  |  |");
			code.push(pass_block + `  /--*`);
			code.push(pass_block + "  |  |");
			
			current_line_index += 3;
			
			
			
			write_end_binary_operation(var_index, var_index_2);
			
			code.push(get_pass_block([]));
			
			current_line_index++;
		}
	}
	
	
	
	function write_not_block(var_index)
	{
		write_start_unary_operation(var_index);
		
		
		
		let pass_block = get_pass_block([var_index]);
		
		code.push(pass_block + "  |");
		code.push(pass_block + "  *-#0-\\");
		code.push(pass_block + "  |    |");
		code.push(pass_block + " [=]---/");
		code.push(pass_block + "  |");
		
		current_line_index += 5;
		
		
		
		write_end_unary_operation(var_index);
		
		code.push(get_pass_block([]));
		
		current_line_index++;
	}
	
	
	
	function write_print_variable_block(var_index)
	{
		write_start_unary_operation(var_index);
		
		
		
		let pass_block = get_pass_block([var_index]);
		
		code.push(pass_block + "  |");
		code.push(pass_block + "  $");
		code.push(pass_block + "  #");
		code.push(pass_block + "  |");
		
		current_line_index += 4;
		
		
		
		write_end_unary_operation(var_index);
		
		code.push(get_pass_block([]));
		
		current_line_index++;
	}
	
	
	
	function write_print_string_block(message)
	{
		write_start_unary_operation(num_total_variables - 1);
		
		
		
		let pass_block = get_pass_block([num_total_variables - 1]);
		
		code.push(pass_block + "  |");
		code.push(pass_block + `  *-$"${message}"`);
		code.push(pass_block + "  |");
		
		current_line_index += 3;
		
		
		
		write_end_unary_operation(num_total_variables - 1);
		
		code.push(get_pass_block([]));
		
		current_line_index++;
	}
	
	
	
	function write_input_block(var_index)
	{
		write_start_unary_operation(var_index);
		
		
		
		let pass_block = get_pass_block([var_index]);
		
		code.push(pass_block + "  |");
		code.push(pass_block + "  #");
		code.push(pass_block + "  ?");
		code.push(pass_block + "  |");
		
		current_line_index += 4;
		
		
		
		write_end_unary_operation(var_index);
		
		code.push(get_pass_block([]));
		
		current_line_index++;
	}
	
	
	
	function write_operation_block(var_index_1, var_index_2, operation)
	{
		if (operation === "|")
		{
			operation = "o";
		}
		
		else if (operation === "?")
		{
			operation = "=";
		}
		
		else if (operation === "[")
		{
			operation = "L";
		}
		
		else if (operation === "]")
		{
			operation = "G";
		}
		
		
		
		write_start_binary_operation(var_index_1, var_index_2);
		
		
		
		let pass_block = get_pass_block([var_index_1, var_index_2]);
		
		code.push(pass_block + "  |  |");
		code.push(pass_block + ` [${operation}]-*`);
		code.push(pass_block + "  |  |");
		
		current_line_index += 3;
		
		
		
		write_end_binary_operation(var_index_1, var_index_2);
		
		code.push(get_pass_block([]));
		
		current_line_index++;
	}
}()