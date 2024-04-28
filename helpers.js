
// functions defined here will be used in index.js
// database credentials are specified in a .env file stored within the same package on the remote machine
// check authorised() for an example of how to query the database and process the results

const mysql = require('mysql');
require('dotenv').config();

// Create a connection to the database using environment variables
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

const dataChartDict = {
      'project_completeness_breakdown': 'line',
      'deadlines_met_last_7_days': 'progressBar',
      'task_status_breakdown': 'pie',
      'member-projects': 'line'
};

const listDataAbout = ['self', 'project', 'avg-employee'];


function valid_request(data_requested, client_token, data_about, target_id){
      // check if the request is missing necessary information
  if (Object.keys(dataChartDict).includes(data_requested) === false){
        return false;
  }
  if (client_token == ''){
        return false;
  }
  if (listDataAbout.includes(data_about) === false){
        return false;
  }
  if (data_about == 'avg-employee'){
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



function authorised(client_token, data_about, target_id) {
    /* if the user is in the project or the user is requesting data about themself or the average employee 
    then authorise, else unauthorised */
    // at the moment, the function always returns true
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
            return false; 
        }
        console.log('Connected to the database');
        
        const sql_query = "SELECT * FROM TokenTable;";
        // Execute a query
        connection.query(sql_query, (err, results) => {
            if (err) {
                console.error('Error executing query:', err);
                connection.end(); // Close the connection if there's an error
                return false; // handle error appropriately
            }
            // console.log('Query results:', results);
            // now can access any results returned
            // Check if the query returned any rows
            if (results.length > 0) {
                // Access specific data within the response, e.g.
                /*
                results.forEach(row => {
                    console.log('Token ID:', row.tokenID);
                    console.log('Employee ID:', row.employeeID);
                    console.log('Time Generated:', row.timeGenerated);
                    // Access other fields as needed
                });
                */
            } else {
                console.log('No rows returned from the query.');
            }
            

            // Close the connection when done - do inside the query callback 
            connection.end();
            return true; // return inside the query callback
            // end of query function
        });
      // end of connect function
    });
   
// end of authorised function
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
    'whole-project': {'deadline': 'idk the date format', 'completed-tasks': 10, 'incomplete-tasks': 4, 'percentage-complete': 71.4},
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

function task_status_breakdown_request(dataAbout, targetId, when){
  const title = 'Breakdown of Task Progress Status';
  let sampleData = {'whole-project': {'Complete': 10, 'In Progress': 3, 'Not Started': 1},
                   'employee-breakdown': [{'name': 'John', 'Complete': 4, 'In Progress': 1, 'Not Started': 0},
                                         {'name': 'Jane', 'Complete': 3, 'In Progress': 0, 'Not Started': 0}
                                         {'name': 'Jen', 'Complete': 2, 'In Progress': 1, 'Not Started': 1}
                                          {'name': 'Jim', 'Complete': 1, 'In Progress': 1, 'Not Started': 0}]};
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
