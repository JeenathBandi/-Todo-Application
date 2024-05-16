const express = require("express");
const app = express();

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(4002, () => {
      console.log("Server is running at http://localhost:4002");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q === "Play";
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasTodoProperty = (requestQuery) => {
  return requestQuery.todo !== undefined;
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { status, priority, search_q = "" } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
                SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
                AND priority = '${priority}'
                AND status = '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
                SELECT * from todo WHERE todo LIKE '%${search_q}%'
                AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
                SELECT * FROM todo WHERE todo LIKE '%${search_q}%'
                AND status = '${status}';`;
      break;
    case hasSearchProperty(request.query):
      getTodosQuery = `
                SELECT * FROM todo WHERE todo LIKE '%Play%';`;
      break;
    default:
      getTodosQuery = `
                SELECT * FROM todo WHERE todo LIKE '%${search_q}%';
            `;
  }

  data = await db.all(getTodosQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getDBQuery = `
        SELECT * FROM todo WHERE id = ${todoId};`;
  const dbResponse = await db.get(getDBQuery);
  response.send(dbResponse);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postDBQuery = `
        INSERT INTO todo(id,todo,priority,status)
        VALUES(${id},'${todo}','${priority}','${status}');`;
  const dbResponse = await db.run(postDBQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo } = request.body;
  let data = null;
  let todoUpdateQuery = "";
  switch (true) {
    case hasStatusProperty(request.body):
      todoUpdateQuery = `UPDATE todo
            SET status='${status}'
            WHERE id = ${todoId}
            ;`;
      data = await db.run(todoUpdateQuery);
      response.send("Status Updated");
      break;
    case hasPriorityProperty(request.body):
      todoUpdateQuery = `UPDATE todo 
            SET priority = '${priority}'
            WHERE id = ${todoId};`;
      data = await db.run(todoUpdateQuery);
      response.send("Priority Updated");
      break;
    case hasTodoProperty(request.body):
      todoUpdateQuery = `UPDATE todo
            SET todo = '${todo}' 
            WHERE id = ${todoId};`;
      data = await db.run(todoUpdateQuery);
      response.send("Todo Updated");
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const dbDeleteQuery = `DELETE FROM todo
    WHERE id = ${todoId};`;
  const dbResponse = await db.run(dbDeleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
