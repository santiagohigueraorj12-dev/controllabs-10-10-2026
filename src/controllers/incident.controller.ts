import { Request, Response } from 'express';

export class IncidentController {
  public static createIncident = (req: Request, res: Response): void => {
    // TODO: llamar al servicio con req.body (asociado a un equipmentId o environmentId)
    // y responder 201 con la novedad creada.
    res.status(501).json({
      success: false,
      message: 'El reporte de novedades todavía no está implementado.'
    });
  };

  public static getIncidents = (req: Request, res: Response): void => {
    // TODO: llamar al servicio y responder 200 con el historial completo de incidencias.
    res.status(501).json({
      success: false,
      message: 'El historial de novedades todavía no está implementado.'
    });
  };

  public static updateIncident = (req: Request, res: Response): void => {
    const { id } = req.params;
    // TODO: pasar id y el nuevo estado enviado en req.body ("pendiente", "en proceso" o "resuelto")
    // a la operación de actualización parcial y responder con la novedad actualizada.
    res.status(501).json({
      success: false,
      message: `La actualización del estado de la novedad ${id} todavía no está implementada.`
    });
  };
}
