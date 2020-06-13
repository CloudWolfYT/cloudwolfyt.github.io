
function updater() {
    var text = document.getElementById('input').value;
    var obj = JSON.parse(text);
    
    if(obj.type == "minecraft:crafting_shapeless") {
      var ing_count = 0;
      var command = "execute";
      //Check ingredients
      for (i in obj.ingredients) {
        command = command.concat(' if data storage ender_craft Chest[{id:"',obj.ingredients[i].item,'"');
        if(obj.ingredients[i].nbt) {
          command = command.concat(',tag:',obj.ingredients[i].nbt);
        }
        command = command.concat('}]');
        ing_count++;
      }
      command = command.concat(' unless score #fields cw_ender_craft matches ',ing_count+1,'.. run scoreboard players set #success cw_ender_craft 1\n');
      
      //Get Result
      command = command.concat('execute if score #success cw_ender_craft matches 1 run data modify storage ender_craft Item set value {id:"',obj.result.item,'",Count:',obj.result.count,'b');
      if(obj.result.nbt) {
        command = command.concat(',tag:',obj.result.nbt);
      }
      command = command.concat('}\n');
      
      //Clearing
      for (i in obj.ingredients) {
        command = command.concat('execute if score #success cw_ender_craft matches 1 if score #clearing cw_ender_craft matches 1 store result score #temp cw_ender_craft run data get storage ender_craft Chest[{id:"',obj.ingredients[i].item,'"');
        if(obj.ingredients[i].nbt) {
          command = command.concat(',tag:',obj.ingredients[i].nbt);
        }
        command = command.concat('}].Count\nexecute if score #success cw_ender_craft matches 1 if score #clearing cw_ender_craft matches 1 store result storage ender_craft Chest[{id:"',obj.ingredients[i].item,'"');
        if(obj.ingredients[i].nbt) {
          command = command.concat(',tag:',obj.ingredients[i].nbt);
        }
        command = command.concat('}].Count byte 1 run scoreboard players remove #temp cw_ender_craft ');
        if(obj.ingredients[i].count) {
          command = command.concat(obj.ingredients[i].count);
        } else {
          command = command.concat('1');
        }
        command = command.concat('\n');
      }
      
    }
    
    if(obj.type=="minecraft:crafting_shaped") {
      var key_names = Object.keys(obj.key);
      // Retrieve the items and their names
      var items = [{},{},{},{},{},{},{},{},{}];
      for(i in key_names) {
        items[i] = obj.key[key_names[i]];
      }
      // Look at pattern based on names
      var pattern = obj.pattern;
      var slots = [{Slot:1},{Slot:2},{Slot:3},{Slot:10},{Slot:11},{Slot:12},{Slot:19},{Slot:20},{Slot:21}];
      var scanner = [{},{},{},{},{},{},{},{},{}];
      var pat_width = 0;
      var pat_height = pattern.length;
      for(i in pattern) {
        var single = pattern[i];
        for(j in single) {
          for(k in key_names) {
            var index = 3 * parseFloat(i) + parseFloat(j);
            if(single[j] == key_names[k]) {
              scanner[index] = Object.assign(scanner[index],items[k]);
              if(parseFloat(j) + 1 > pat_width) pat_width = parseFloat(j) + 1;
            } else if(single[j] == " ") {
              if(parseFloat(j) + 1 > pat_width) pat_width = parseFloat(j) + 1;
            }
          }
        }
      }
      if(pat_width == 0 || pat_height == 0) console.log("ERROR: Pattern of Zero Size");
      //Searching linear combinations
      var possibilities = [];
      var shapeless = 0;
      console.log(pat_width); console.log(pat_height);
      possibilities.push(Object.assign(scanner));
      if(pat_width == 2 && pat_height == 3) {
        var temp_scan = JSON.parse(JSON.stringify(scanner));
        temp_scan[2] = JSON.parse(JSON.stringify(temp_scan[1]));
        temp_scan[1] = JSON.parse(JSON.stringify(temp_scan[0]));
        temp_scan[5] = JSON.parse(JSON.stringify(temp_scan[4]));
        temp_scan[4] = JSON.parse(JSON.stringify(temp_scan[3]));
        temp_scan[8] = JSON.parse(JSON.stringify(temp_scan[7]));
        temp_scan[7] = JSON.parse(JSON.stringify(temp_scan[6]));
        delete temp_scan[0].item;
        delete temp_scan[3].item;
        delete temp_scan[6].item;
        possibilities.push(Object.assign(temp_scan));
      } else if(pat_width == 3 && pat_height == 2) {
        var temp_scan = JSON.parse(JSON.stringify(scanner));
        temp_scan[6] = JSON.parse(JSON.stringify(temp_scan[3]));
        temp_scan[7] = JSON.parse(JSON.stringify(temp_scan[4]));
        temp_scan[8] = JSON.parse(JSON.stringify(temp_scan[5]));
        temp_scan[3] = JSON.parse(JSON.stringify(temp_scan[0]));
        temp_scan[4] = JSON.parse(JSON.stringify(temp_scan[1]));
        temp_scan[5] = JSON.parse(JSON.stringify(temp_scan[2]));
        delete temp_scan[0].item;
        delete temp_scan[1].item;
        delete temp_scan[2].item;
        possibilities.push(Object.assign(temp_scan));      
      } else if(pat_width == 1 && pat_height == 3) {
        var temp_scan = JSON.parse(JSON.stringify(scanner));
        temp_scan[1] = JSON.parse(JSON.stringify(temp_scan[0]));
        temp_scan[4] = JSON.parse(JSON.stringify(temp_scan[3]));
        temp_scan[7] = JSON.parse(JSON.stringify(temp_scan[6]));
        delete temp_scan[0].item;
        delete temp_scan[3].item;
        delete temp_scan[6].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));
        temp_scan[2] = JSON.parse(JSON.stringify(temp_scan[1]));
        temp_scan[5] = JSON.parse(JSON.stringify(temp_scan[4]));
        temp_scan[8] = JSON.parse(JSON.stringify(temp_scan[7]));
        delete temp_scan[1].item;
        delete temp_scan[4].item;
        delete temp_scan[7].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));
      } else if(pat_width==3 && pat_height==1) {
        var temp_scan = JSON.parse(JSON.stringify(scanner));
        temp_scan[3] = JSON.parse(JSON.stringify(temp_scan[0]));
        temp_scan[4] = JSON.parse(JSON.stringify(temp_scan[1]));
        temp_scan[5] = JSON.parse(JSON.stringify(temp_scan[2]));
        delete temp_scan[0].item;
        delete temp_scan[1].item;
        delete temp_scan[2].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));
        temp_scan[6] = JSON.parse(JSON.stringify(temp_scan[3]));
        temp_scan[7] = JSON.parse(JSON.stringify(temp_scan[4]));
        temp_scan[8] = JSON.parse(JSON.stringify(temp_scan[5]));
        delete temp_scan[3].item;
        delete temp_scan[4].item;
        delete temp_scan[5].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));      
      } else if(pat_width == 2 && pat_height ==2) {
        var temp_scan = JSON.parse(JSON.stringify(scanner));
        temp_scan[2] = JSON.parse(JSON.stringify(temp_scan[1]));
        temp_scan[5] = JSON.parse(JSON.stringify(temp_scan[4]));
        temp_scan[1] = JSON.parse(JSON.stringify(temp_scan[0]));
        temp_scan[4] = JSON.parse(JSON.stringify(temp_scan[3]));
        delete temp_scan[0].item;
        delete temp_scan[3].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));
        temp_scan[7] = JSON.parse(JSON.stringify(temp_scan[4]));
        temp_scan[8] = JSON.parse(JSON.stringify(temp_scan[5]));
        temp_scan[5] = JSON.parse(JSON.stringify(temp_scan[2]));
        temp_scan[4] = JSON.parse(JSON.stringify(temp_scan[1]));
        delete temp_scan[1].item;
        delete temp_scan[2].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));    
        temp_scan[3] = JSON.parse(JSON.stringify(temp_scan[4]));
        temp_scan[6] = JSON.parse(JSON.stringify(temp_scan[7]));
        temp_scan[4] = JSON.parse(JSON.stringify(temp_scan[5]));
        temp_scan[7] = JSON.parse(JSON.stringify(temp_scan[8]));
        delete temp_scan[5].item;
        delete temp_scan[8].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));      
      } else if(pat_width==1 && pat_height == 2) {
        var temp_scan = JSON.parse(JSON.stringify(scanner));
        temp_scan[1] = JSON.parse(JSON.stringify(temp_scan[0]));
        temp_scan[4] = JSON.parse(JSON.stringify(temp_scan[3]));
        delete temp_scan[0].item;
        delete temp_scan[3].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));
        temp_scan[2] = JSON.parse(JSON.stringify(temp_scan[1]));
        temp_scan[5] = JSON.parse(JSON.stringify(temp_scan[4]));
        delete temp_scan[1].item;
        delete temp_scan[4].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));    
        temp_scan[8] = JSON.parse(JSON.stringify(temp_scan[5]));
        temp_scan[5] = JSON.parse(JSON.stringify(temp_scan[2]));
        delete temp_scan[2].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));
        temp_scan[4] = JSON.parse(JSON.stringify(temp_scan[5]));
        temp_scan[7] = JSON.parse(JSON.stringify(temp_scan[8]));
        delete temp_scan[5].item;
        delete temp_scan[8].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));  
        temp_scan[3] = JSON.parse(JSON.stringify(temp_scan[4]));
        temp_scan[6] = JSON.parse(JSON.stringify(temp_scan[7]));
        delete temp_scan[4].item;
        delete temp_scan[7].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));  
      } else if(pat_width==2 && pat_height == 1) {
        var temp_scan = JSON.parse(JSON.stringify(scanner));
        temp_scan[2] = JSON.parse(JSON.stringify(temp_scan[1]));
        temp_scan[1] = JSON.parse(JSON.stringify(temp_scan[0]));
        delete temp_scan[0].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));
        temp_scan[3] = JSON.parse(JSON.stringify(temp_scan[1]));
        temp_scan[4] = JSON.parse(JSON.stringify(temp_scan[2]));
        delete temp_scan[1].item;
        delete temp_scan[2].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));    
        temp_scan[5] = JSON.parse(JSON.stringify(temp_scan[4]));
        temp_scan[4] = JSON.parse(JSON.stringify(temp_scan[3]));
        delete temp_scan[3].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));
        temp_scan[6] = JSON.parse(JSON.stringify(temp_scan[4]));
        temp_scan[7] = JSON.parse(JSON.stringify(temp_scan[5]));
        delete temp_scan[4].item;
        delete temp_scan[5].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));  
        temp_scan[8] = JSON.parse(JSON.stringify(temp_scan[7]));
        temp_scan[7] = JSON.parse(JSON.stringify(temp_scan[6]));
        delete temp_scan[6].item;
        possibilities.push(JSON.parse(JSON.stringify(temp_scan)));  
      } else if(pat_width==1 && pat_height==1) {
        console.log("ERROR: NO PATTERN, treating as shapeless");
        shapeless = 1;
      }
      
      //BUILDING THE COMMAND
      var ing_count = 0;
      var command = "";
      //Load Scanner Values
      for(i in possibilities) {
        command = command.concat("execute");
        var temp_scan = JSON.parse(JSON.stringify(possibilities[i]));
        for (j in temp_scan) {
          if(!shapeless) {
            if(temp_scan[j].item) {
              command = command.concat(' if data storage ender_craft Chest[{Slot:',slots[j].Slot,'b,id:"',temp_scan[j].item,'"');
              if(temp_scan[j].nbt) {
                command = command.concat(',tag:',temp_scan[j].nbt);
              }
              command = command.concat('}]');
              if(i == 0) ing_count++;
            }
          } else {
            if(temp_scan[j].item) {
              command = command.concat(' if data storage ender_craft Chest[{id:"',temp_scan[j].item,'"');
              if(temp_scan[j].nbt) {
                command = command.concat(',tag:',temp_scan[j].nbt);
              }
              command = command.concat('}]');
              if(i == 0) ing_count++;
            }          
          }
        }
        command = command.concat(' unless score #fields cw_ender_craft matches ',ing_count+1,'.. run scoreboard players set #success cw_ender_craft 1\n');
      }
      
      
      //Get Result
      command = command.concat('execute if score #success cw_ender_craft matches 1 run data modify storage ender_craft Item set value  {id:"',obj.result.item,'",Count:',obj.result.count,'b');
      if(obj.result.nbt) {
        command = command.concat(',tag:',obj.result.nbt);
      }
      command = command.concat('}\n');
  
      //Clear
      for(i in possibilities) {
        var temp_scan = JSON.parse(JSON.stringify(possibilities[i]));
        for (j in temp_scan) {
          if(!shapeless) {
            if(temp_scan[j].item) {
              command = command.concat('execute if score #success cw_ender_craft matches 1 if score #clearing cw_ender_craft matches 1 store result score #temp cw_ender_craft run data get storage ender_craft Chest[{Slot:',slots[j].Slot,'b,id:"',temp_scan[j].item,'"');
              if(temp_scan[j].nbt) {
                command = command.concat(',tag:',temp_scan[j].nbt);
              }
              command = command.concat('}].Count\nexecute if score #success cw_ender_craft matches 1 if score #clearing cw_ender_craft matches 1 if score #temp cw_ender_craft matches 1.. store result storage ender_craft Chest[{Slot:',slots[j].Slot,'b,id:"',temp_scan[j].item,'"');
              if(temp_scan[j].nbt) {
                command = command.concat(',tag:',temp_scan[j].nbt);
              }
              command = command.concat('}].Count byte 1 run scoreboard players remove #temp cw_ender_craft 1\n');
            }
          } else {
            if(temp_scan[j].item) {
              command = command.concat('execute if score #success cw_ender_craft matches 1 if score #clearing cw_ender_craft matches 1 store result score #temp cw_ender_craft run data get storage ender_craft Chest[{id:"',temp_scan[j].item,'"');
              if(temp_scan[j].nbt) {
                command = command.concat(',tag:',temp_scan[j].nbt);
              }
              command = command.concat('}].Count\nexecute if score #success cw_ender_craft matches 1 if score #clearing cw_ender_craft matches 1 if score #temp cw_ender_craft matches 1.. store result storage ender_craft Chest[{id:"',temp_scan[j].item,'"');
              if(temp_scan[j].nbt) {
                command = command.concat(',tag:',temp_scan[j].nbt);
              }
              command = command.concat('}].Count byte 1 run scoreboard players remove #temp cw_ender_craft 1\n');
            }      
          }
          }
        }
      
    }
    document.getElementById('output').value= command;
  }