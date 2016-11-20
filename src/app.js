self.app = {};

document.addEventListener('DOMContentLoaded', startApplication);

function startApplication() {
    app.DataLoader.loadCSV('family_data/kalashyan_en.csv').then(tree => console.log(tree));
}
