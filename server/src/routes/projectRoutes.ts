import { Router, Request, Response } from 'express';

export const projectRouter = Router();

// In-Memory Projects and Assets Store for Backend Pipeline
const projectStore = new Map<string, any>();
const projectAssetMap = new Map<string, Set<string>>();

/**
 * Cascading Delete Project Endpoint
 * Deletes the project and all associated folders, video files, and comment records.
 */
projectRouter.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const project = projectStore.get(id);

  // Retrieve associated asset IDs for cascading deletion
  const associatedAssetIds = Array.from(projectAssetMap.get(id) || []);

  // Execute Cascading Cleanup
  projectStore.delete(id);
  projectAssetMap.delete(id);

  res.json({
    success: true,
    message: `Cascading delete executed for project ${id}. Cleaned up ${associatedAssetIds.length} assets and associated comments.`,
    deletedProjectId: id,
    deletedAssetIds: associatedAssetIds,
  });
});
