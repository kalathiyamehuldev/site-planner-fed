import xus from '@/lib/xus';
import type {
    Project,
    CreateProjectDto,
    UpdateProjectDto,
    PaginationDto,
    FilterDto,
    PaginatedResponseDto,
} from '@/common/types/project.types';

export const projectService = {
    async getAll(pagination?: PaginationDto, filters?: FilterDto): Promise<PaginatedResponseDto<Project>> {
        const response = await xus.get('/projects', { params: { ...pagination, ...filters } });
        return response.data;
    },

    async getById(id: string): Promise<Project> {
        const response = await xus.get(`/projects/${id}`);
        return response.data;
    },

    async create(project: CreateProjectDto): Promise<Project> {
        const response = await xus.post('/projects', project);
        return response.data;
    },

    async update(id: string, project: UpdateProjectDto): Promise<Project> {
        const response = await xus.patch(`/projects/${id}`, project);
        return response.data;
    },

    async delete(id: string): Promise<void> {
        await xus.delete(`/projects/${id}`);
    },
}; 