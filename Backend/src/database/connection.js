import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.production' });

// Configuração da conexão com o banco de dados
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '12435687',
  database: process.env.DB_NAME || 'kontrollapro',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  multipleStatements: true
};

// Pool de conexões
const pool = mysql.createPool(dbConfig);

// Função para testar a conexão
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexão com MySQL estabelecida com sucesso');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com MySQL:', error.message);
    return false;
  }
};

// Função para executar queries
export const query = async (sql, params = []) => {
  try {
    const [rows, fields] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Erro na query:', error);
    throw error;
  }
};

// Função para executar queries que retornam resultado com insertId
export const queryWithResult = async (sql, params = []) => {
  try {
    const [result] = await pool.execute(sql, params);
    return result;
  } catch (error) {
    console.error('Erro na query:', error);
    throw error;
  }
};

// Função para executar transações
export const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Função para fechar o pool de conexões
export const closePool = async () => {
  try {
    await pool.end();
    console.log('🔒 Pool de conexões MySQL fechado');
  } catch (error) {
    console.error('Erro ao fechar pool de conexões:', error);
  }
};

export default pool;
