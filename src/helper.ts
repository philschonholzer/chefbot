export function getHashes(text: string, callback?: (hash: string) => void): string[] {
    let projects: string[] = [], re = /<#([^\\.\s]+)>/g, project;
    while (project = re.exec(text)) {
        if (callback) callback(project[1]);
        projects.push(project[0]);
    }
    return projects;
}
