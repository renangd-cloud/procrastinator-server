/**
 * Enum dos tipos de ação registrados no log de auditoria de tarefas.
 * Use estas constantes em vez de strings literais em todo o código.
 */
const TaskLogActionType = Object.freeze({
    CREATION:    'CREATION',
    UPDATE:      'UPDATE',
    INACTIVATION: 'INACTIVATION',
    COMMENT:     'COMMENT',
});

module.exports = TaskLogActionType;
