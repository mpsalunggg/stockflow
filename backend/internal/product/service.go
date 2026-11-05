package product

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, params ListParams) (ListResult, error) {
	products, total, err := s.repo.List(ctx, params)
	if err != nil {
		return ListResult{}, err
	}
	return ListResult{Data: products, Page: params.Page, Limit: params.Limit, Total: total}, nil
}

func (s *Service) Summary(ctx context.Context) (Summary, error) {
	return s.repo.Summary(ctx)
}

func (s *Service) Get(ctx context.Context, id int) (Product, error) {
	return s.repo.get(ctx, id)
}

func (s *Service) Create(ctx context.Context, in ProductInput) (Product, error) {
	in.normalize()
	if err := in.validate(false); err != nil {
		return Product{}, err
	}
	return s.repo.Create(ctx, in)
}

func (s *Service) Update(ctx context.Context, id int, in ProductInput) (Product, error) {
	in.normalize()
	if err := in.validate(true); err != nil {
		return Product{}, err
	}
	return s.repo.Update(ctx, id, in)
}

func (s *Service) Delete(ctx context.Context, id int) error {
	return s.repo.Delete(ctx, id)
}
