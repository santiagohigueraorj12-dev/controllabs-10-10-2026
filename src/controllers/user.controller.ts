import { Request, Response } from 'express';

export class UserController {
  public static getUsers = (req: Request, res: Response): void => {
    // TODO: llamar al servicio y responder 200 con el listado de usuarios.
    res.status(501).json({
      success: false,
      message: 'El listado de usuarios todavía no está implementado.'
    });
  };

  public static createUser = (req: Request, res: Response): void => {
    // TODO: llamar al servicio con req.body (perfil: estudiante, docente o administrador)
    // y responder 201 con el usuario creado.
    res.status(501).json({
      success: false,
      message: 'El registro de usuarios todavía no está implementado.'
    });
  };

  public static getUserById = (req: Request, res: Response): void => {
    const { id } = req.params;
    // TODO: pasar id a la operación de consulta y responder con el usuario encontrado.
    res.status(501).json({
      success: false,
      message: `La consulta del usuario ${id} todavía no está implementada.`
    });
  };

  public static updateUser = (req: Request, res: Response): void => {
    const { id } = req.params;
    // TODO: pasar id y solo los campos enviados en req.body (rol, estado de cuenta o contraseña)
    // a la operación de actualización parcial y responder con el usuario actualizado.
    res.status(501).json({
      success: false,
      message: `La actualización parcial del usuario ${id} todavía no está implementada.`
    });
  };

  public static deleteUser = (req: Request, res: Response): void => {
    const { id } = req.params;
    // TODO: pasar id a la operación de eliminación lógica (marcar como inactivo, no borrar el registro).
    res.status(501).json({
      success: false,
      message: `La eliminación lógica del usuario ${id} todavía no está implementada.`
    });
  };
}
