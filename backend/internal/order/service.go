package order

import "context"

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) List(ctx context.Context, params ListParams) (ListResult, error) {
	orders, total, err := s.repo.List(ctx, params)
	if err != nil {
		return ListResult{}, err
	}
	return ListResult{Data: orders, Page: params.Page, Limit: params.Limit, Total: total}, nil
}

func (s *Service) Create(ctx context.Context, in CreateInput) (Order, error) {
	in.normalize()
	if err := in.validate(); err != nil {
		return Order{}, err
	}
	return s.repo.Create(ctx, in)
}

func (s *Service) Get(ctx context.Context, id int) (Order, error) {
	return s.repo.Get(ctx, id)
}

func (s *Service) Cancel(ctx context.Context, id int) (Order, error) {
	return s.repo.Cancel(ctx, id)
}
