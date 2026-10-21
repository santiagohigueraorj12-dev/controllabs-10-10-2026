import { Request, Response } from 'express';

export class EquipmentController {
  public static createEquipment = (req: Request, res: Response): void => {
    // TODO: llamar al servicio con req.body (incluye el environmentId del laboratorio)
    // y responder 201 con el equipo creado.
    res.status(501).json({
      success: false,
      message: 'El registro de equipos todavía no está implementado.'
    });
  };

  public static getEquipment = (req: Request, res: Response): void => {
    const { environmentId } = req.query;
    // TODO: si llega environmentId en req.query, filtrar los equipos de ese ambiente;
    // si no, listar todos. Responder 200 con los resultados.
    res.status(501).json({
      success: false,
      message: environmentId
        ? `El listado de equipos del ambiente ${environmentId} todavía no está implementado.`
        : 'El listado de equipos todavía no está implementado.'
    });
  };

  public static updateEquipment = (req: Request, res: Response): void => {
    const { id } = req.params;
    // TODO: pasar id y solo los campos enviados en req.body (ej. estado técnico o ubicación)
    // a la operación de actualización parcial y responder con el equipo actualizado.
    res.status(501).json({
      success: false,
      message: `La actualización parcial del equipo ${id} todavía no está implementada.`
    });
  };
}
