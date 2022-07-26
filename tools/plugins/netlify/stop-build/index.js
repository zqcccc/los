module.exports = {
  onPrebuild: ({ utils }) => {
    const currentProject = 'ws-client';
    const projectHasChanged = false;
    if (!projectHasChanged) {
      utils.build.cancelBuild(
        `Build was cancelled because ${currentProject} was not affected by the latest changes`
      );
    }
  }
}
