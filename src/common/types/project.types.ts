export interface Project {
    id: string;
    title: string;
    client: string;
    status: ProjectStatus;
    dueDate: string;
    team: string[];
    progress: number;
    description: string;
    budget: number;
    startDate: string;
    endDate: string;
    createdAt?: string;
    updatedAt?: string;
}

export type ProjectStatus = 'Not Started' | 'In Progress' | 'On Hold' | 'Completed';

export interface CreateProjectDto {
    title: string;
    client: string;
    status: ProjectStatus;
    dueDate: string;
    team: string[];
    progress: number;
    description: string;
    budget: number;
    startDate: string;
    endDate: string;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> { }

export interface PaginationDto {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface FilterDto {
    search?: string;
    status?: ProjectStatus;
    client?: string;
    startDate?: string;
    endDate?: string;
}

export interface PaginatedResponseDto<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
} 