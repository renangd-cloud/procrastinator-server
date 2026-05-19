/**
 * Enum de status válidos para tarefas e execuções de tarefas.
 * Use estas constantes em vez de strings literais em todo o código.
 */
const TaskStatus = Object.freeze({
    PENDING: 'Pending',
    COMPLETED: 'Completed',
});

module.exports = TaskStatus;
