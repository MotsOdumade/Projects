
// functions defined here will be used in index.js
// database credentials are specified in a .env file stored within the same package on the remote machine
// check authorised() for an example of how to query the database and process the results

const dataChartDict = {
      'project-completeness-breakdown': 'speedometer',
      'deadlines-met-last-7-days': 'progress bar',
      'task-status-breakdown': 'pie',
      'member-projects': 'list'
};

const listDataAbout = ['project', 'avg-project'];


const mysql = require('mysql');
require('dotenv').config();

function execute_sql_query(sql_query){
  // Create a connection to the database using environment variables
    const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });

    // Connect to the database
    connection.connect((err) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return false; // handle error appropriately
        }
        // Execute a query
        console.log('Connected to the database');
        connection.query(sql_query, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                connection.end(); // Close the connection if there's an error
                return false; 
            }
            // access result
              
            // Map each row to a plain JavaScript object
            const formattedResults = results.map(row => {
                  
                const formattedRow = {};
                for (const key in row) {
                  formattedRow[key] = row[key];
                }
                return formattedRow;
              });

            // Log the formatted results
              console.log(formattedResults);

              // Close the connection
              connection.end();
              return formattedResults;
            });
    });
}



function valid_request(data_requested, access_code, data_about, target_id){
      // check if the request is missing necessary information
  if (Object.keys(dataChartDict).includes(data_requested) === false){
        return false;
  }
  if (access_code == ''){
        return false;
  }
  if (listDataAbout.includes(data_about) === false){
        return false;
  }
  if (data_about == 'avg-project'){
        return true;
  } 
  if (target_id == ''){
        return false;
  }
  
  if (isNaN(target_id)){
        // it's not a number
        return false;
  }
  return true;
}


function authorised(access_code) {
    // verify the access code provided
    if (access_code == process.env.ACCESS_CODE){
      // correct access code for company-analytics code 
      execute_sql_query("SELECT * FROM EmployeeTable;");
      return true;
    } 
    // else incorrect access_code 
    return false;
    
}


function data_to_chart(data_requested){
  
  // -- matches dataRequest to a chart type - probably unnecessary
  const chart = dataChartDict[data_requested];
  return chart;
}

// ---- functions to execute requests

function project_completeness_breakdown_request(dataAbout, targetId, when){
  const title = 'Breakdown of the Complete and Incomplete Tasks';
  let sampleData = {
    'whole-project': {'deadline': '', 'completed-tasks': 10, 'incomplete-tasks': 4, 'percentage-complete': 71.4},
    'employee-breakdown': [{'name': 'John', 'completed-tasks': 4, 'incomplete-tasks': 1, 'percentage-complete': 80.0},
                          {'name': 'Jane', 'completed-tasks': 3, 'incomplete-tasks': 0, 'percentage-complete': 100.0},
                          {'name': 'Jen', 'completed-tasks': 2, 'incomplete-tasks': 2, 'percentage-complete': 50.0},
                          {'name': 'Jim', 'completed-tasks': 1, 'incomplete-tasks': 1, 'percentage-complete': 50.0}] 
    };

  return {'title': title, 'sampleData': sampleData};
}




function deadlines_met_last_7_days_request(dataAbout, targetId, when){
  const title = 'Breakdown of Project Deadlines Met in the Last 7 Days';
  let sampleData = {
    'whole-project': {'total-tasks': 14, 'deadlines-met': 6, 'percentage-complete': 71.4},
    'employee-breakdown': [{'name': 'John', 'total-tasks': 5, 'deadlines-met': 3, 'percentage-complete': 42.9},
                          {'name': 'Jane', 'total-tasks': 3, 'deadlines-met': 0, 'percentage-complete': 0.0},
                          {'name': 'Jen', 'total-tasks': 4, 'deadlines-met': 2, 'percentage-complete': 50.0},
                          {'name': 'Jim', 'total-tasks': 2, 'deadlines-met': 1, 'percentage-complete': 50.0}] 
    };

  return {'title': title, 'sampleData': sampleData};
}

async function task_status_breakdown_request(targetId){
  const title = 'Breakdown of Task Progress Status';
  const membersQuery = `select user_id, project_id, first_name from project_team_member inner join user on project_team_member.user_id = user.id where project_team_member.project_id = $[targetId];`;
  let sampleData = {
        labels: ['Whole Project'], // Example employee names
        datasets: [{
          label: 'Not Started',
          backgroundColor: 'rgba(255, 174, 71, 0.5)',
          data: [25, 2, 0, 1] // Example number of completed tasks for each entity
        },{
          label: 'In Progress Tasks',
          backgroundColor: 'rgba(54, 162, 235, 0.5)',
          data: [10, 5, 8, 6] // Example number of in-progress tasks for each entity
        }, {
          label: 'Completed Tasks',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          data: [20, 10, 15, 12] // Example number of completed tasks for each entity
        }]
};

  try {
    // query the database
    let queryData1 = await execute_sql_query(membersQuery);
    let userIds = [];
    let query_not_started = `SELECT COUNT(*) AS Tasks
      FROM task 
      LEFT JOIN task_start ON task.id = task_start.task_id 
      WHERE task_start.task_id IS NULL AND task.deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') AND task.project_id =${targetId}`;
    let query_in_progress = `SELECT COUNT(*) AS Tasks
      FROM task 
      INNER JOIN task_start ON task.id = task_start.task_id 
      LEFT JOIN task_complete ON task.id = task_complete.task_id   
      WHERE task_complete.task_id IS NULL AND task.deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') AND task.project_id =${targetId}`;
    let query_completed = `SELECT COUNT(*) AS Tasks
      FROM task 
      INNER JOIN task_complete ON task.id = task_complete.task_id 
      WHERE task.deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') AND task.project_id = ${targetId}`;
        
      for (let i = 0; i < queryData1.length; i++){
            sampleData['labels'].push(queryData1[i]["first_name"]);
            userIds.push(queryData1[i]["user_id"]);
      }
      // query tasks not started for each user within that project
      for (let i = 0; i < userIds.length; i++){
            let extraQuery1 = `UNION SELECT COUNT(*) 
                  FROM task 
                  LEFT JOIN task_start ON task.id = task_start.task_id 
                  WHERE task_start.task_id IS NULL 
                  AND task.deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') 
                  AND task.project_id =${targetId} 
                  AND assigned_user_id = ${userIds[i]}`;
            query_not_started += extraQuery1;
            extraQuery2 = `UNION SELECT COUNT(*) 
                  FROM task 
                  INNER JOIN task_start 
                  ON task.id = task_start.task_id 
                  LEFT JOIN task_complete 
                  ON task.id = task_complete.task_id   
                  WHERE task_complete.task_id IS 
                  NULL AND task.deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') 
                  AND task.project_id =${targetId} 
                  AND assigned_user_id = ${userIds[i]}`;
            query_in_progress += extraQuery2;
            extraQuery3 = `UNION SELECT COUNT(*) 
                  FROM task 
                  INNER JOIN task_complete 
                  ON task.id = task_complete.task_id 
                  WHERE task.deadline > STR_TO_DATE('2024-05-17 13:42:04', '%Y-%m-%d %H:%i:%s') 
                  AND task.project_id = ${targetId} 
                  AND assigned_user_id = ${userIds[i]}`;
            query_completed += extraQuery3;
      }
      query_not_started += ";";
      query_in_progress += ";";
      query_completed += ";";
        
      // execute the queries
        
      try { // not started
          // query the database
          let queryData2 = await execute_sql_query(query_not_started);
          console.log("task_weight_breakdown_request has waited for sql query and got back this many rows", queryData2.length);
            
          try { // in progress
                // query the database
                let queryData3 = await execute_sql_query(query_in_progress);
                console.log("task_weight_breakdown_request has waited for sql query and got back this many rows", queryData3.length);
                
                try { // completed
                      // query the database
                      let queryData4 = await execute_sql_query(query_completed);
                      console.log("task_weight_breakdown_request has waited for sql query and got back this many rows", queryData4.length);
                      // process the results
                      for (int i = 0; i < queryData2.length; i++){
                            sampleData['datasets'][0]['data'].push(queryData2[i]["Tasks"]);
                      }
                      for (int i = 0; i < queryData3.length; i++){
                            sampleData['datasets'][1]['data'].push(queryData3[i]["Tasks"]);
                      }
                      for (int i = 0; i < queryData4.length; i++){
                            sampleData['datasets'][2]['data'].push(queryData4[i]["Tasks"]);
                      }
                      
                      return {'title': title, 'sampleData': sampleData};
                  } catch (error) {
                      console.error('Error executing SQL query:', error);
                      // Handle the error here
                  }
            } catch (error) {
                console.error('Error executing SQL query:', error);
                // Handle the error here
            }

      } catch (error) {
          console.error('Error executing SQL query:', error);
          // Handle the error here
      }
      
      
      console.log("num_projects has waited for sql query and got back this many rows", queryData1.length);
    return {'title': title, 'sampleData': sampleData};
  } catch (error) {
    console.error('Error executing SQL query:', error);
    // Handle the error here
  }
  return {'title': title, 'sampleData': sampleData};
}



function member_projects_request(targetId){
  // returns a list of objects representing the projects that the individual is currently in
  const title = 'Projects Involved In';
  let sampleData = [];
  // query the database
  
  sampleData = [
    {'project-id': '1201', 'project-name': 'Skill Swap Initiative'},
    {'project-id': '1205', 'project-name': 'Office Connect Project'},
    {'project-id': '1202', 'project-name': 'Corporate Social Responsibility Campaign'},
    {'project-id': '1204', 'project-name': 'Employee Training and Development Initiative'},
    {'project-id': '1209', 'project-name': 'Customer Experience Enhancement Project'},
    {'project-id': '1207', 'project-name': 'Performance Management System Upgrade'},
    {'project-id': '1200', 'project-name': 'Risk Management and Compliance Review'},
  ];
  
  return {'title': title, 'sampleData': sampleData};
}


module.exports = {valid_request,
                  authorised,
                  data_to_chart,
                  project_completeness_breakdown_request,
                  deadlines_met_last_7_days_request,
                  task_status_breakdown_request,
                  member_projects_request};
