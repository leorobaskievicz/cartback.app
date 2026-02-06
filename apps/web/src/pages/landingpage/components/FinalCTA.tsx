import { Box, Container, Typography, Button, useTheme, alpha } from "@mui/material";
import { CheckCircle as CheckCircleIcon } from "@mui/icons-material";

export default function FinalCTA() {
  const theme = useTheme();

  const guarantees = ["✓ 7 dias grátis", "✓ Cancele quando quiser", "✓ Suporte incluso"];

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        position: "relative",
        overflow: "hidden",
        background: theme.palette.gradient.primary,
      }}
    >
      <Container maxWidth="md">
        <Box sx={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "2rem", md: "3rem" },
              fontWeight: 800,
              mb: 3,
              color: "#FFFFFF",
            }}
          >
            Pronto para recuperar suas vendas?
          </Typography>
          <Typography
            variant="h5"
            sx={{
              mb: 5,
              color: alpha("#FFFFFF", 0.95),
              fontWeight: 500,
              lineHeight: 1.6,
            }}
          >
            Comece seu teste grátis agora.
            <br />
            Sem cartão de crédito. Sem compromisso.
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => (window.location.href = "/register")}
            sx={{
              py: 2.5,
              px: 6,
              fontSize: "1.2rem",
              fontWeight: 700,
              mb: 4,
              backgroundColor: "#FFFFFF",
              color: #ffffff,
              "&:hover": {
                backgroundColor: alpha("#FFFFFF", 0.9),
                transform: "translateY(-2px)",
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
              },
              transition: "all 0.2s",
            }}
          >
            Começar Teste Grátis →
          </Button>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: { xs: 2, md: 4 },
              flexWrap: "wrap",
            }}
          >
            {guarantees.map((guarantee, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  color: "#FFFFFF",
                }}
              >
                <CheckCircleIcon sx={{ fontSize: 20 }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {guarantee}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>

      {/* Background Pattern */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          pointerEvents: "none",
        }}
      />
    </Box>
  );
}
