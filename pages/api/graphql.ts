import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";
import { ApolloServer, gql } from "apollo-server-micro";
import { IResolvers } from "@graphql-tools/utils";
import mysql from "serverless-mysql";
import { OkPacket } from "mysql";

const typeDefs = gql`
  enum TaskStatus {
    completed
    active
  }

  type Task {
    id: Int!
    title: String!
    status: TaskStatus!
  }

  input CreateTaskInput {
    title: String!
  }

  input UpdateTaskInput {
    id: Int!
    title: String
    status: TaskStatus
  }

  type Query {
    tasks(status: TaskStatus): [Task!]!
    task(id: Int!): Task
  }

  type Mutation {
    createTask(input: CreateTaskInput!): Task
    updateTask(input: UpdateTaskInput!): Task
    deleteTask(id: Int!): Task
  }
`;

interface ApolloContext {
  db: mysql.ServerlessMysql;
}

enum TaskStatus {
  active = "active",
  completed = "completed",
}

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
}

interface TasksDbRow {
  id: number;
  title: string;
  task_status: TaskStatus;
}

type TaskDbQueryResult = TasksDbRow[];

const resolvers: IResolvers<any, ApolloContext> = {
  Query: {
    async tasks(
      parent,
      args: { status?: TaskStatus },
      context
    ): Promise<Task[]> {
      const { status } = args;
      let query = "SELECT id, title, task_status FROM tasks";
      const queryParams: string[] = [];

      if (status) {
        query += " WHERE task_status = ?";
        queryParams.push(status);
      }
      const tasks = await context.db.query<TaskDbQueryResult>(
        query,
        queryParams
      );
      await db.end();
      return tasks.map(({ id, title, task_status }) => ({
        id,
        title,
        status: task_status,
      }));
    },
    task() {
      return null;
    },
  },
  Mutation: {
    async createTask(
      parent,
      args: { input: { title: string } },
      context
    ): Promise<Task> {
      const result = await context.db.query<OkPacket>(
        "INSERT INTO tasks (title, task_status) VALUES(?, ?)",
        [args.input.title, TaskStatus.active]
      );
      return {
        id: result.insertId,
        title: args.input.title,
        status: TaskStatus.active,
      };
    },
    updateTask(parent, args, context) {
      return null;
    },
    deleteTask(parent, args, context) {
      return null;
    },
  },
};

const db = mysql({
  config: {
    host: process.env.NEXT_PUBLIC_MYSQL_HOST,
    user: process.env.NEXT_PUBLIC_MYSQL_USER,
    database: process.env.NEXT_PUBLIC_MYSQL_DATABASE,
    password: process.env.NEXT_PUBLIC_MYSQL_PASSWORD,
  },
});

const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
  context: { db },
  plugins: [
    ...(process.env.NODE_ENV === "development"
      ? [ApolloServerPluginLandingPageGraphQLPlayground]
      : []),
  ],
});

const startServer = apolloServer.start();

export default async function handler(req: any, res: any) {
  await startServer;
  await apolloServer.createHandler({
    path: "/api/graphql",
  })(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
