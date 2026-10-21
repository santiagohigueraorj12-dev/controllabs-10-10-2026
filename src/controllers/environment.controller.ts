import { Request, Response } from 'express';

export class EnvironmentController {
  public static getEnvironments = (req: Request, res: Response): void => {
    // TODO: llamar al servicio y responder 200 con los espacios físicos y laboratorios.
    res.status(501).json({
      success: false,
      message: 'El listado de ambientes todavía no está implementado.'
    });
  };

  public static createEnvironment = (req: Request, res: Response): void => {
    // TODO: llamar al servicio con req.body (capacidad y ubicación) y responder 201 con el ambiente creado.
    res.status(501).json({
      success: false,
      message: 'El registro de ambientes todavía no está implementado.'
    });
  };

  public static updateEnvironment = (req: Request, res: Response): void => {
    const { id } = req.params;
    // TODO: pasar id y solo los campos enviados en req.body (ej. capacidad o estado operativo)
    // a la operación de actualización parcial y responder con el ambiente actualizado.
    res.status(501).json({
      success: false,
      message: `La actualización parcial del ambiente ${id} todavía no está implementada.`
    });
  };
}
