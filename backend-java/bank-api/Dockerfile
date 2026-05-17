# Build
FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app

COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline -DskipTests

COPY src ./src
RUN ./mvnw -B -DskipTests package

# Runtime
FROM eclipse-temurin:17-jre-alpine
RUN apk add --no-cache curl
WORKDIR /app

COPY --from=build /app/target/bank-api-*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --retries=12 --start-period=60s \
  CMD curl -fsS http://localhost:8080/v3/api-docs > /dev/null || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
