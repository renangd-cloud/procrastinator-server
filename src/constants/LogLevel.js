/**
 * Enum dos níveis de severidade usados nos registros do Log de sistema.
 * Use estas constantes em vez de strings literais em todo o código.
 */
const LogLevel = Object.freeze({
    INFO:  'info',
    WARN:  'warn',
    ERROR: 'error',
});

module.exports = LogLevel;
