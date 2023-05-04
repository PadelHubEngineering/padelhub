import * as dotenv from "dotenv";
dotenv.config();

export default {
    env: "development", // Scelta tra "development" e "production"
    mongodb_connection_string: `mongodb+srv://${process.env.MONGO_USR}:${process.env.MONGO_PWD}@cluster0.czj2jc8.mongodb.net/?retryWrites=true&w=majority/PadelHub-DB`
}
