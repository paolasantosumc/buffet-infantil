import app from './server/app.js';
const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Comida Feliz API rodando em http://localhost:${port}`));
